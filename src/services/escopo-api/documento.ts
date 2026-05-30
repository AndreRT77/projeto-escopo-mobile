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

export async function criarDocumentoEmUmaCategoria(
  categoriaId: string | number,
  body: { titulo: string },
): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/categoria/${categoriaId}/documento`, body)

  return response.data
}

export interface DetalhesDocumento {
  id: number
  titulo: string
  conteudo: string
  ultima_alteracao: string
  projeto: string
  categoria: string
}

export async function obterDetalhesDeUmDocumento(
  documentoId: string | number,
): Promise<DetalhesDocumento> {
  const response = await api.get(`${ENV.API_URL}/api/v1/documento/${documentoId}`)

  return response.data
}

export async function excluirDocumento(documentoId: string | number) {
  const response = await api.delete(`${ENV.API_URL}/api/v1/documento/${documentoId}`)

  return response.data
}

export async function atualizarTitulo(documentoId: string | number, body: { titulo: string }) {
  const response = await api.patch(`${ENV.API_URL}/api/v1/documento/${documentoId}/titulo`, body)

  return response.data
}

export async function adicionarNovaVersaoDeUmDocumento(
  documentoId: string | number,
  body: { conteudo: string },
): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/documento/${documentoId}/conteudo`, body)

  return response.data
}

export interface VersaoMin {
  id: number
  criado_em: string
}

export async function obterHistoricoDeVersoes(documentoId: string | number): Promise<VersaoMin[]> {
  const response = await api.get(`${ENV.API_URL}/api/v1/documento/${documentoId}/versoes`)

  return response.data
}

export interface DetalhesVersao {
  id: number
  titulo: string
  conteudo: string
  criado_em: string
}

export async function obterDetalhesDeUmaVersao(versaoId: string | number): Promise<DetalhesVersao> {
  const response = await api.get(`${ENV.API_URL}/api/v1/documento/versao/${versaoId}`)

  return response.data
}
