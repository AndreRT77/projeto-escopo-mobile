import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface Registro {
  id: number
  titulo: string
  conteudo: string | null
  atualizado_em: string
  criado_em: string
}

export async function obterRegistrosDeUmProjeto(projetoId: string | number): Promise<Registro[]> {
  const response = await api.get(`${ENV.API_URL}/api/v1/projeto/${projetoId}/registros`)

  return response.data
}

export async function criarRegistroEmUmProjeto(
  projetoId: string | number,
  body: {
    titulo: string
    conteudo: string
  },
): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/projeto/${projetoId}/registro`, body)

  return response.data
}

export async function atualizarTitulo(
  registroId: string | number,
  body: {
    titulo: string
  },
) {
  const response = await api.patch(`${ENV.API_URL}/api/v1/registro/${registroId}/titulo`, body)

  return response.data
}

export async function atualizarConteudo(
  registroId: string | number,
  body: {
    conteudo: string | null
  },
) {
  const response = await api.patch(`${ENV.API_URL}/api/v1/registro/${registroId}/conteudo`, body)

  return response.data
}

export async function obterDetalhesDeUmRegistro(registroId: string | number): Promise<Registro> {
  const response = await api.get(`${ENV.API_URL}/api/v1/registro/${registroId}`)

  return response.data
}

export async function excluirRegistro(registroId: string | number) {
  const response = await api.delete(`${ENV.API_URL}/api/v1/registro/${registroId}`)

  return response.data
}
