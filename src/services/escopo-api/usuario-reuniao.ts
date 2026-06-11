import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export async function criarUsuario(
  reuniaoId: number | string,
  body: {
    usuario_id: number
  },
): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/reuniao/${reuniaoId}/usuario`, body)

  return response.data
}

export async function excluirUsuario(usuarioId: number | string, reuniaoId: number | string) {
  const response = await api.delete(
    `${ENV.API_URL}/api/v1/reuniao/${reuniaoId}/usuario/${usuarioId}`,
  )

  return response.data
}
