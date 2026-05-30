import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface CriarLink {
  tipo_link_id: number
  url: string
  nome?: string | null
}

export async function criarLink(
  reuniaoId: number | string,
  body: CriarLink,
): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/reuniao/${reuniaoId}/link`, body)

  return response.data
}

export interface AtualizarLink {
  url: string
  nome: string
}

export async function atualizarLink(linkId: number | string, body: AtualizarLink) {
  const response = await api.patch(`${ENV.API_URL}/api/v1/reuniao/link/${linkId}`, body)

  return response.data
}

export async function excluirLink(linkId: number | string) {
  const response = await api.delete(`${ENV.API_URL}/api/v1/reuniao/link/${linkId}`)

  return response.data
}
