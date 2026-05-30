import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface Reuniao {
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
