import z from 'zod'

export const passwordSchema = z
  .object({
    senhaAtual: z.string().min(1, { error: 'Senha atual é obrigatória' }),
    novaSenha: z
      .string({ error: 'Deve ser um texto' })
      .trim()
      .min(8, { error: 'Mínimo 8 caracteres' })
      .max(64, { error: 'Máximo 64 caracteres' }),
    confirmarSenha: z.string().min(1, { error: 'Confirme a nova senha' }),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: 'As novas senhas não coincidem',
    path: ['confirmarSenha'],
  })
  .refine((data) => data.senhaAtual !== data.novaSenha, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['novaSenha'],
  })

export type PasswordData = z.infer<typeof passwordSchema>

export const deleteSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export type DeleteData = z.infer<typeof deleteSchema>
