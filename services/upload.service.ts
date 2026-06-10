import { supabaseAdmin } from '@/lib/supabase/client'
import { documentRepository } from '@/repositories/document.repository'

export const uploadService = {
  uploadFile: async (
    file: File,
    userId: string,
    title: string
  ) => {
    // 1. Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    // 2. Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) throw new Error(`Upload failed: ${error.message}`)

    // 3. Get file URL
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(fileName)

    // 4. Save metadata to DB
    const document = await documentRepository.create({
      title,
      fileName: file.name,
      fileUrl: urlData.publicUrl,
      fileType: file.type,
      fileSize: file.size,
      userId,
    })

    return document
  },
}