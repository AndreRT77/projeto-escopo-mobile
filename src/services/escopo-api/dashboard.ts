import { ENV } from '@/constants/env'
import { api } from '@/services/api'

interface StatusConvite {
  id: number
  nome: string
}

interface Convite {
  id: number
  projeto_id: number
  nome_remetente: string
  nome_projeto: string
  criado_em: string
  status: StatusConvite
}

interface Documento {
  id: number
  projeto: string
  categoria: string
  documento: string
  ultima_edicao: string
}

export interface DashboardResponse {
  documentos: Documento[]
  convites: Convite[]
}

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await api.get(`${ENV.API_URL}/api/v1/dashboard`)

  return response.data
}
