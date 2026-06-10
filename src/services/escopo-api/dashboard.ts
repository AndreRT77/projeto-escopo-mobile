import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface Convite {
  id: number
  projeto_id: number
  nome_remetente: string
  projeto: string
  criado_em: string
  status: {
    id: number
    nome: string
  }
}

export interface Documento {
  id: number
  projeto_id?: number
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
