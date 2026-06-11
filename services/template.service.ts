import { supabaseAdmin } from '@/lib/supabase/client'
import { templateRepository } from '@/repositories/template.repository'

export const templateService = {
  uploadTemplate: async (
    file: File,
    userId: string,
    name: string,
    type: string
  ) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `templates/${userId}/${Date.now()}.${fileExt}`

    const { error } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) throw new Error(`Upload failed: ${error.message}`)

    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(fileName)

    return templateRepository.create({
      name,
      type,
      fileName: file.name,
      fileUrl: urlData.publicUrl,
      fileType: file.type,
      fileSize: file.size,
      userId,
    })
  },
}
