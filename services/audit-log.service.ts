import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export type AuditAction =
  | 'irrelevant_query'
  | 'relevant_query_reset'
  | 'access_restricted'
  | 'unblock_requested'
  | 'access_restored'
  | 'document_security_block'

type AuditEntry = {
  action: AuditAction
  targetUserId: string
  actorUserId?: string | null
  documentId?: string | null
  question?: string | null
  reason?: string | null
  metadata?: Record<string, unknown>
  ipAddress?: string | null
}

export const auditLogService = {
  async record(entry: AuditEntry) {
    const question =
      entry.question && entry.question.length > 500
        ? `${entry.question.slice(0, 497)}...`
        : entry.question

    return prisma.accessAuditLog.create({
      data: {
        action: entry.action,
        targetUserId: entry.targetUserId,
        actorUserId: entry.actorUserId ?? null,
        documentId: entry.documentId ?? null,
        question: question ?? null,
        reason: entry.reason ?? null,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    })
  },

  async listForUser(targetUserId: string, limit = 20) {
    const rows = await prisma.accessAuditLog.findMany({
      where: { targetUserId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
    })
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      question: r.question,
      reason: r.reason,
      documentId: r.documentId,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
      actor: r.actor
        ? { id: r.actor.id, email: r.actor.email, name: r.actor.name }
        : null,
    }))
  },

  async listRecent(params: { page: number; limit: number; action?: string }) {
    const where = params.action ? { action: params.action } : {}
    const [total, rows] = await Promise.all([
      prisma.accessAuditLog.count({ where }),
      prisma.accessAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          actor: { select: { id: true, email: true, name: true } },
          target: { select: { id: true, email: true, name: true } },
        },
      }),
    ])
    return {
      logs: rows.map((r) => ({
        id: r.id,
        action: r.action,
        question: r.question,
        reason: r.reason,
        documentId: r.documentId,
        createdAt: r.createdAt.toISOString(),
        actor: r.actor,
        target: r.target,
      })),
      total,
    }
  },
}
