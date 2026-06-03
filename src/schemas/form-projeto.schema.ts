import z from 'zod'

export const criarProjetoSchema = z.object({
  titulo: z
    .string({ error: 'Deve ser uma String' })
    .trim()
    .min(1, { error: 'Mínimo 1 caractere' })
    .max(100, { error: 'Máximo 100 caracteres' }),
  descricao: z.string({ error: 'Deve ser uma String' }).optional(),
  integrantes: z
    .array(
      z.object({
        id: z
          .number({ error: 'O ID de um integrante deve ser um número' })
          .positive({ error: 'O ID de um integrante deve ser positivo' }),
        nivel_acesso_id: z
          .number({ error: 'O ID de nível de acesso de um integrante deve ser um número' })
          .positive({ error: 'O ID nível de acesso de um integrante deve ser positivo' }),
      }),
      { error: 'Integrantes deve ser um array' },
    )
    .optional(),
})

export type criarProjetoData = z.infer<typeof criarProjetoSchema>

export const atualizarProjetoSchema = z.object({
  titulo: z
    .string({ error: 'Deve ser uma String' })
    .trim()
    .min(1, { error: 'Mínimo 1 caractere' })
    .max(100, { error: 'Máximo 100 caracteres' }),
  descricao: z.string({ error: 'Deve ser uma String' }).optional(),
  integrantes: z
    .object({
      atuais: z
        .array(
          z.object({
            usuario_projeto_id: z
              .number({ error: 'O usuario_projeto_id deve ser um número' })
              .positive({ error: 'O usuario_projeto_id deve ser positivo' }),
            nivel_acesso_id: z
              .number({ error: 'O ID de nível de acesso deve ser um número' })
              .positive({ error: 'O ID de nível de acesso deve ser positivo' }),
          }),
          { error: 'Integrantes atuais deve ser um array' },
        )
        .optional(),
      excluidos: z
        .array(
          z.object({
            usuario_projeto_id: z
              .number({ error: 'O usuario_projeto_id deve ser um número' })
              .positive({ error: 'O usuario_projeto_id deve ser positivo' }),
          }),
          { error: 'Integrantes excluídos deve ser um array' },
        )
        .optional(),
    })
    .optional(),
  convites: z
    .object({
      adicionais: z
        .array(
          z.object({
            usuario_id: z
              .number({ error: 'O usuario_id deve ser um número' })
              .positive({ error: 'O usuario_id deve ser positivo' }),
            nivel_acesso_id: z
              .number({ error: 'O ID de nível de acesso deve ser um número' })
              .positive({ error: 'O ID de nível de acesso deve ser positivo' }),
          }),
          { error: 'Convites adicionais deve ser um array' },
        )
        .optional(),
      pendentes: z
        .array(
          z.object({
            convite_id: z
              .number({ error: 'O convite_id deve ser um número' })
              .positive({ error: 'O convite_id deve ser positivo' }),
            nivel_acesso_id: z
              .number({ error: 'O ID de nível de acesso deve ser um número' })
              .positive({ error: 'O ID de nível de acesso deve ser positivo' }),
          }),
          { error: 'Convites pendentes deve ser um array' },
        )
        .optional(),
      excluidos: z
        .array(
          z.object({
            convite_id: z
              .number({ error: 'O convite_id deve ser um número' })
              .positive({ error: 'O convite_id deve ser positivo' }),
          }),
          { error: 'Convites excluídos deve ser um array' },
        )
        .optional(),
    })
    .optional(),
})

export type atualizarProjetoData = z.infer<typeof atualizarProjetoSchema>
