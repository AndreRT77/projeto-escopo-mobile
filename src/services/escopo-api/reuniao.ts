import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface Reuniao {
  id: number
  titulo: string
  criado_em: string
  foto_usuarios: string[]
}

export async function obterReunioesDeUmProjeto(projetoId: string | number): Promise<Reuniao[]> {
  const response = await api.get(`${ENV.API_URL}/api/v1/projeto/${projetoId}/reunioes`)

  return response.data
}

export async function criarReuniaoEmUmProjeto(
  projetoId: string | number,
  body: { titulo: string },
): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/projeto/${projetoId}/reuniao`, body)

  return response.data
}

export async function atualizarTitulo(
  reuniaoId: string | number,
  body: {
    titulo: string
  },
) {
  const response = await api.patch(`${ENV.API_URL}/api/v1/reuniao/${reuniaoId}/titulo`, body)

  return response.data
}

export async function atualizarTranscricao(
  reuniaoId: string | number,
  body: {
    transcricao: string
  },
) {
  const response = await api.patch(`${ENV.API_URL}/api/v1/reuniao/${reuniaoId}/transcricao`, body)

  return response.data
}

export interface DetalhesReuniao {
  id: number
  titulo: string
  criado_em: string
  projeto_id: number
  links: {
    id: number
    url: string
    nome: string
    tipo_link: string
  }[]
  convidados: {
    id: number
    nome: string
    cargo: string
  }[]
  usuarios: {
    id: number
    nome: string
    cargo: string
    foto_perfil: string | null
  }[]
}

export async function obterDetalhesDeUmaReuniao(
  reuniaoId: string | number,
): Promise<DetalhesReuniao> {
  const response = await api.get(`${ENV.API_URL}/api/v1/reuniao/${reuniaoId}`)

  return response.data
}

export async function excluirReuniao(reuniaoId: string | number) {
  const response = await api.delete(`${ENV.API_URL}/api/v1/reuniao/${reuniaoId}`)

  return response.data
}
