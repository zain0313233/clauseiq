import { supabaseAdmin } from '@/lib/supabase/client'
import type { AllowedDocumentMime } from '@/lib/file-validation'
import { templateRepository } from '@/repositories/template.repository'

export const templateService = {
  uploadTemplate: async (
    file: File,
    userId: string,
    name: string,
    type: string,
    contentType: AllowedDocumentMime
  ) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `templates/${userId}/${Date.now()}.${fileExt}`

    const { error } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, file, {
        contentType,
        upsert: false,
      })

    if (error) throw new Error(`Upload failed: ${error.message}`)

    return templateRepository.create({
      name,
      type,
      fileName: file.name,
      fileUrl: fileName,
      fileType: contentType,
      fileSize: file.size,
      userId,
    })
  },
}
