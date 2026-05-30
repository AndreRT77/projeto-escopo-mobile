import { ENV } from '@/constants/env'
import { api } from '@/services/api'

interface updateConviteProps {
  conviteId: number | string
  novoStatusId: number
}

export async function atualizarStatus({ conviteId, novoStatusId }: updateConviteProps) {
  const response = await api.patch(`${ENV.API_URL}/api/v1/convite/${conviteId}`, {
    novo_status_id: novoStatusId,
  })

  return response.data
}

export async function excluirConvite(id: number) {
  const response = await api.delete(`${ENV.API_URL}/api/v1/convite/${id}`)

  return response.data
}
