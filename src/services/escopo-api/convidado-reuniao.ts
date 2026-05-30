import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface Convidado {
  nome: string
  cargo?: string | null
}

export async function criarConvidado(
  reuniaoId: number | string,
  body: Convidado,
): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/reuniao/${reuniaoId}/convidado`, body)

  return response.data
}

export async function atualizarConvidado(convidadoId: number | string, body: Convidado) {
  const response = await api.put(`${ENV.API_URL}/api/v1/reuniao/convidado/${convidadoId}`, body)

  return response.data
}

export async function excluirConvidado(convidadoId: number | string) {
  const response = await api.delete(`${ENV.API_URL}/api/v1/reuniao/convidado/${convidadoId}`)

  return response.data
}
