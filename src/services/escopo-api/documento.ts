import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface CategoriasComDocumentos {
  projeto: {
    id: number
    categorias: {
      id: number
      nome: string
      documentos: {
        id: number
        titulo: string
        ultima_alteracao: string
        quantidade_versoes: number
      }[]
    }[]
  }
}

export async function obterCategoriasComDocumentoDeUmProjeto(
  projetoId: string | number,
): Promise<CategoriasComDocumentos> {
  const response = await api.get(`${ENV.API_URL}/api/v1/projeto/${projetoId}/categorias/documentos`)

  return response.data
}
