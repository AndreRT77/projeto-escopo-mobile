import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string({ error: 'Deve ser um texto' })
    .trim()
    .min(6, { error: 'Mínimo 6 caracteres' })
    .max(150, { error: 'Máximo 150 caracteres' })
    .toLowerCase()
    .email({ error: 'Deve ser um e-mail válido' }),
  senha: z
    .string({ error: 'Deve ser um texto' })
    .trim()
    .min(8, { error: 'Mínimo 8 caracteres' })
    .max(64, { error: 'Máximo 64 caracteres' }),
})

export type LoginData = z.infer<typeof loginSchema>
