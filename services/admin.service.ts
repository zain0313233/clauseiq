import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { userRepository } from '@/repositories/user.repository'
import { adminRepository } from '@/repositories/admin.repository'
import { documentRepository } from '@/repositories/document.repository'
import { deleteDocumentVectorsWithRetry } from '@/lib/pinecone-delete'
import { removeStorageObject } from '@/lib/storage'
import { otpService } from '@/services/otp.service'
import { aiService } from '@/services/ai.service'
import { logger } from '@/lib/logger'

export const adminService = {
  async updateUserRole(actorId: string, targetId: string, role: 'user' | 'admin') {
    if (actorId === targetId && role === 'user') {
      const adminCount = await adminRepository.countAdmins()
      if (adminCount <= 1) {
        throw new Error('Cannot demote the last admin')
      }
    }

    const target = await userRepository.findById(targetId)
    if (!target) throw new Error('User not found')

    if (target.role === 'admin' && role === 'user') {
      const adminCount = await adminRepository.countAdmins()
      if (adminCount <= 1) {
        throw new Error('Cannot demote the last admin')
      }
    }

    return prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    })
  },

  async deleteUser(actorId: string, targetId: string) {
    if (actorId === targetId) {
      throw new Error('Cannot delete your own account')
    }

    const target = await userRepository.findById(targetId)
    if (!target) throw new Error('User not found')

    if (target.role === 'admin') {
      const adminCount = await adminRepository.countAdmins()
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin')
      }
    }

    const [documents, templates] = await Promise.all([
      documentRepository.findByUserId(targetId),
      prisma.standardTemplate.findMany({
        where: { userId: targetId },
        select: { id: true, fileUrl: true },
      }),
    ])

    for (const doc of documents) {
      await deleteDocumentVectorsWithRetry(doc.id, targetId)
      try {
        await removeStorageObject(doc.fileUrl)
      } catch (error) {
        logger.warn('admin.delete_user.storage', {
          documentId: doc.id,
          error: error instanceof Error ? error.message : 'unknown',
        })
      }
      await documentRepository.delete(doc.id)
    }

    for (const template of templates) {
      try {
        await removeStorageObject(template.fileUrl)
      } catch (error) {
        logger.warn('admin.delete_user.template_storage', {
          templateId: template.id,
          error: error instanceof Error ? error.message : 'unknown',
        })
      }
      await prisma.standardTemplate.delete({ where: { id: template.id } })
    }

    await prisma.otpCode.deleteMany({
      where: { email: target.email.trim().toLowerCase() },
    })

    await prisma.notification.deleteMany({ where: { userId: targetId } })

    await prisma.user.delete({ where: { id: targetId } })

    logger.info('admin.delete_user.complete', {
      targetId,
      documentsRemoved: documents.length,
      templatesRemoved: templates.length,
    })
  },

  async resendVerification(email: string) {
    const user = await userRepository.findByEmail(email)
    if (!user) throw new Error('User not found')
    if (user.emailVerified) throw new Error('Email is already verified')
    await otpService.sendCode(user.email, 'verify_email')
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await userRepository.findById(userId)
    if (!user) throw new Error('Unauthorized')

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) throw new Error('Current password is incorrect')

    const hashed = await bcrypt.hash(newPassword, 10)
    await userRepository.updatePassword(user.id, hashed)
    await userRepository.incrementTokenVersion(user.id)
  },

  async runDocumentContentReview(adminId: string, documentId: string) {
    const detail = await adminRepository.getDocumentDetail(documentId)
    if (!detail) throw new Error('Document not found')

    const result = await aiService.validateDocument({
      document_id: documentId,
      title: detail.title,
      reviewed_by: adminId,
      persist: true,
    })

    return { detail, result }
  },

  async setDocumentReviewStatus(
    adminId: string,
    documentId: string,
    status: 'valid' | 'suspicious' | 'rejected' | 'pending',
    queriesEnabled?: boolean
  ) {
    const document = await documentRepository.findById(documentId)
    if (!document) throw new Error('Document not found')

    const enableQueries =
      queriesEnabled !== undefined
        ? queriesEnabled
        : status !== 'rejected'

    return documentRepository.updateContentReview(documentId, {
      contentReviewStatus: status,
      contentReviewNotes: {
        manual: true,
        status,
        queriesEnabled: enableQueries,
        reviewedBy: adminId,
      },
      contentReviewedBy: adminId,
      queriesEnabled: enableQueries,
    })
  },
}
