import { z } from 'zod'

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
  all: z.boolean().optional(),
})
