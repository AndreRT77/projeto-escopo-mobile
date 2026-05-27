import { z } from 'zod'

export const registerSchema = z.object({
  nome: z
    .string({ error: 'Deve ser uma String' })
    .trim()
    .min(1, { error: 'Mínimo 1 caractere' })
    .max(100, { error: 'Máximo 100 caracteres' }),
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

export type RegisterData = z.infer<typeof registerSchema>
