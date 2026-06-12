import { supabaseAdmin } from '@/lib/supabase/client'
import type { AllowedDocumentMime } from '@/lib/file-validation'
import { documentRepository } from '@/repositories/document.repository'

export const uploadService = {
  uploadFile: async (
    file: File,
    userId: string,
    title: string,
    contentType: AllowedDocumentMime
  ) => {
    // 1. Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    // 2. Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, file, {
        contentType,
        upsert: false,
      })

    if (error) throw new Error(`Upload failed: ${error.message}`)

    // Store private object path; signed URLs are generated when the engine needs access
    const document = await documentRepository.create({
      title,
      fileName: file.name,
      fileUrl: fileName,
      fileType: contentType,
      fileSize: file.size,
      userId,
    })

    return document
  },
}