import { z } from 'zod'

export const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  fileType: z.enum(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  fileSize: z.number().max(10 * 1024 * 1024, 'File size must be under 10MB'),
})

export type UploadInput = z.infer<typeof uploadSchema>