import z from 'zod'

export const categoriaSchema = z.object({
  titulo: z
    .string({ error: 'Deve ser uma String' })
    .min(1, { error: 'Mínimo 1 caractere' })
    .max(100, { error: 'Máximo 100 caracteres' }),
})

export type CategoriaData = z.infer<typeof categoriaSchema>

export const reuniaoSchema = z.object({
  titulo: z
    .string({ error: 'Deve ser uma String' })
    .min(1, { error: 'Mínimo 1 caractere' })
    .max(150, { error: 'Máximo 150 caracteres' }),
})

export type ReuniaoData = z.infer<typeof reuniaoSchema>

export type GroupedData<T> = Record<number, Record<string, T[]>>
