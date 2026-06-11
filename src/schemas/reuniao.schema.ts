import { z } from 'zod'

export const editarGravacaoSchema = z.object({
  nome: z.string().max(50, { message: 'Máximo 50 caracteres' }).optional().or(z.literal('')),
  url: z
    .string({ error: 'A URL é obrigatória' })
    .min(1, { message: 'A URL é obrigatória' })
    .max(500, { message: 'Máximo 500 caracteres' })
    .url({ message: 'Deve ser uma URL válida' }),
})
export type EditarGravacaoData = z.infer<typeof editarGravacaoSchema>

export const criarLinkSchema = z.object({
  nome: z
    .string({ error: 'O nome é obrigatório' })
    .min(1, { message: 'O nome é obrigatório' })
    .max(50, { message: 'Máximo 50 caracteres' }),
  url: z
    .string({ error: 'A URL é obrigatória' })
    .min(1, { message: 'A URL é obrigatória' })
    .max(500, { message: 'Máximo 500 caracteres' })
    .url({ message: 'Deve ser uma URL válida' }),
})
export type CriarLinkData = z.infer<typeof criarLinkSchema>

export const adicionarUsuarioSchema = z.object({
  email: z
    .string({ error: 'O e-mail é obrigatório' })
    .min(1, { message: 'O e-mail é obrigatório' })
    .email({ message: 'Endereço de e-mail inválido' }),
})
export type AdicionarUsuarioData = z.infer<typeof adicionarUsuarioSchema>

export const adicionarConvidadoSchema = z.object({
  nome: z
    .string({ error: 'O nome é obrigatório' })
    .min(1, { message: 'O nome é obrigatório' })
    .max(100, { message: 'Máximo 100 caracteres' }),
  cargo: z.string().max(100, { message: 'Máximo 100 caracteres' }).optional().or(z.literal('')),
})
export type AdicionarConvidadoData = z.infer<typeof adicionarConvidadoSchema>

export const atualizarTituloReuniaoSchema = z.object({
  titulo: z
    .string({ error: 'Deve ser uma String' })
    .min(1, { error: 'Mínimo 1 caractere' })
    .max(150, { error: 'Máximo 150 caracteres' }),
})
export type atualizarTituloReuniaoData = z.infer<typeof atualizarTituloReuniaoSchema>
