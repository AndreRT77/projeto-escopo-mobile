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

export interface DetalhesDoProjeto {
  id: number
  titulo: string
  descricao: string
  status: boolean
  data_criacao: string
  ultima_atualizacao: string
  nome_responsavel: string
  criador_id: number
  nivel_acesso_id: number
}

export async function obterDetalhesDoProjetoPorId(
  projetoId: number | string,
): Promise<DetalhesDoProjeto> {
  const response = await api.get(`${ENV.API_URL}/api/v1/projeto/${projetoId}`)

  return response.data
}
