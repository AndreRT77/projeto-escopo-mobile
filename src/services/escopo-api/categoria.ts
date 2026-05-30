import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export async function excluirCategoria(id: number | string) {
  const response = await api.delete(`${ENV.API_URL}/api/v1/projeto/categoria/${id}`)

  return response.data
}

export async function criarCategoria(projetoId: number | string, body: { titulo: string }) {
  const response = await api.post(`${ENV.API_URL}/api/v1/projeto/${projetoId}/categoria`, body)

  return response.data
}
