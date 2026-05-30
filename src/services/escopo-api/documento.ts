import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface CategoriasComDocumentosResponse {
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
): Promise<CategoriasComDocumentosResponse> {
  const response = await api.get(`${ENV.API_URL}/api/v1/projeto/${projetoId}/categorias/documentos`)

  return response.data
}
