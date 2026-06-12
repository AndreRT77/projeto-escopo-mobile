import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface Notificacao {
  id: number
  descricao: string
  data: string
  aberto: number
  comentario_id: number
  documento_id: number
  documento_titulo: string
  projeto_id: number
  projeto_titulo: string
}

export async function obterNotificacoes(): Promise<Notificacao[]> {
  const response = await api.get(`${ENV.API_URL}/api/v1/notificacoes`)

  return response.data
}

export async function marcarNotificacaoComoLida(notificacaoId: string | number) {
  const response = await api.patch(`${ENV.API_URL}/api/v1/notificacao/${notificacaoId}`)

  return response.data
}
