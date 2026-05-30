import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface Comentario {
  id: number
  conteudo: string
  criado_em: string
  parent_id: number | null
  registro_referencia: number | null
  comentario_tipo: {
    id: number
    nome: string
  }
}

export async function obterComentariosDeUmDocumento(
  documentoId: number | string,
): Promise<Comentario[]> {
  const response = await api.get(`${ENV.API_URL}/api/v1/documento/${documentoId}/comentarios`)

  return response.data
}

export interface CriarComentario {
  conteudo: string
  parent_id?: number | null
  registro_referencia_id?: number | null
  comentario_tipo_id: number
}

export async function criarComentarioEmUmDocumento(
  documentoId: number | string,
  body: CriarComentario,
): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/documento/${documentoId}/comentario`, body)

  return response.data
}
