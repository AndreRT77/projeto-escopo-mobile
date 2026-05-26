import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface Project {
  id: number
  titulo: string
  descricao: string
  foto_usuarios: string[]
}

export async function getProjects(): Promise<Project[]> {
  const response = await api.get(`${ENV.API_URL}/api/v1/projetos`)

  return response.data
}
