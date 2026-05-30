import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface CriarProjeto {
  titulo: string
  descricao?: string
  integrantes?: {
    id: number
    nivel_acesso_id: number
  }[]
}

export async function criarProjeto(body: CriarProjeto): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/projeto`, body)

  return response.data
}

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

export interface AtualizarProjeto {
  titulo: string
  descricao?: string
  integrantes?: {
    atuais?: {
      usuario_projeto_id: number
      nivel_acesso_id: number
    }[]
    excluidos?: {
      usuario_projeto_id: number
    }[]
  }
  convites?: {
    adicionais?: {
      usuario_id: number
      nivel_acesso_id: number
    }[]
    pendentes?: {
      convite_id: number
      nivel_acesso_id: number
    }[]
    excluidos?: {
      convite_id: number
    }[]
  }
}

export async function atualizarProjeto(
  projetoId: string | number,
  body: AtualizarProjeto,
): Promise<{
  id: number
  titulo: string
  descricao: string
}> {
  const response = await api.put(`${ENV.API_URL}/api/v1/projeto/${projetoId}`, body)

  return response.data
}

export async function excluirProjeto(projetoId: number | string) {
  const response = await api.delete(`${ENV.API_URL}/api/v1/projeto/${projetoId}`)

  return response.data
}

export interface ProjetoParticipantesResponse {
  projeto_id: number
  participantes: Participante[]
  pendentes: ConvitePendente[]
}

export interface Participante {
  nome: string
  email: string
  projeto_id: number
  usuario_id: number
  foto_perfil: string | null
  nivel_acesso: string
  nivel_acesso_id: number
  usuario_projeto_id: number
}

export interface ConvitePendente {
  nome: string
  email: string
  convite_id: number
  projeto_id: number
  usuario_id: number
  foto_perfil: string | null
  convidado_em: string
  nivel_acesso: string
  nivel_acesso_id: number
}

export async function obterParticipantesDeUmProjeto(
  projetoId: number | string,
): Promise<ProjetoParticipantesResponse> {
  const response = await api.get(`${ENV.API_URL}/api/v1/projeto/${projetoId}/participantes`)

  return response.data
}
