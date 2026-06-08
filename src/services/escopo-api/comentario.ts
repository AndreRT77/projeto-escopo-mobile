import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface Comentario {
  id: number
  conteudo: string
  criado_em: string
  parent_id: number | null
  registro_referencia: number | string | Record<string, unknown> | null
  registro_referencia_id?: number | string | null
  comentario_tipo_id?: number | string | null
  criador_id?: number
  criador_nome?: string
  nome_criador?: string
  usuario_nome?: string
  foto_perfil?: string | null
  comentario_tipo?:
    | number
    | string
    | {
        id?: number | string
        nome?: string
      }
  [key: string]: unknown
}

export async function obterComentariosDeUmDocumento(
  documentoId: number | string,
): Promise<Comentario[]> {
  const response = await api.get(`${ENV.API_URL}/api/v1/documento/${documentoId}/comentarios`)

  return response.data
}

export interface CriarComentario {
  conteudo: string
  parent_id?: number | string | null
  registro_referencia_id?: number | string | null
  comentario_tipo_id: number | string
}

export async function criarComentarioEmUmDocumento(
  documentoId: number | string,
  body: CriarComentario,
): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/documento/${documentoId}/comentario`, body)

  return response.data
}
