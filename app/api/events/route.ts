import { NextRequest } from 'next/server'
import { requireEmailVerified } from '@/lib/auth-session'
import { encodeSseEvent, SSE_HEADERS } from '@/lib/sse'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const WATCH_INTERVAL_MS = 2_000

export async function GET(req: NextRequest) {
  try {
    const user = await requireEmailVerified(req)

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        let closed = false
        let lastNotificationAt = new Date()
        const documentStatuses = new Map<string, string>()
        const analysisStatuses = new Map<string, string>()
        let initialized = false

        const send = (event: string, data: unknown) => {
          if (closed) return
          controller.enqueue(encoder.encode(encodeSseEvent(event, data)))
        }

        const close = () => {
          if (closed) return
          closed = true
          clearInterval(intervalId)
          try {
            controller.close()
          } catch {
            // already closed
          }
        }

        const watch = async () => {
          if (closed) return

          const [notifications, documents, analyses] = await Promise.all([
            prisma.notification.findMany({
              where: {
                userId: user.id,
                createdAt: { gt: lastNotificationAt },
              },
              orderBy: { createdAt: 'asc' },
              take: 20,
            }),
            prisma.document.findMany({
              where: { userId: user.id },
              select: { id: true, title: true, status: true },
            }),
            prisma.documentAnalysis.findMany({
              where: { document: { userId: user.id } },
              select: {
                documentId: true,
                status: true,
                riskLevel: true,
                document: { select: { title: true } },
              },
            }),
          ])

          for (const notification of notifications) {
            lastNotificationAt = notification.createdAt
            send('notification', {
              id: notification.id,
              type: notification.type,
              title: notification.title,
              body: notification.body,
              read: notification.read,
              metadata: notification.metadata,
              createdAt: notification.createdAt.toISOString(),
            })
          }

          for (const doc of documents) {
            const prev = documentStatuses.get(doc.id)
            if (initialized && prev && prev !== doc.status) {
              send('document.status', {
                documentId: doc.id,
                title: doc.title,
                status: doc.status,
                previousStatus: prev,
              })
            }
            documentStatuses.set(doc.id, doc.status)
          }

          for (const analysis of analyses) {
            const prev = analysisStatuses.get(analysis.documentId)
            if (initialized && prev && prev !== analysis.status) {
              send('analysis.status', {
                documentId: analysis.documentId,
                title: analysis.document.title,
                status: analysis.status,
                riskLevel: analysis.riskLevel,
                previousStatus: prev,
              })
            }
            analysisStatuses.set(analysis.documentId, analysis.status)
          }

          initialized = true
        }

        send('connected', { ok: true })
        void watch()

        const intervalId = setInterval(() => {
          void watch().catch(() => close())
        }, WATCH_INTERVAL_MS)

        req.signal.addEventListener('abort', close)
      },
    })

    return new Response(stream, {
      headers: {
        ...SSE_HEADERS,
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    const status =
      message === 'Unauthorized'
        ? 401
        : message === 'Email not verified'
          ? 403
          : 400
    return new Response(JSON.stringify({ error: message }), { status })
  }
}
