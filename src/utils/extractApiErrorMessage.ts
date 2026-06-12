import axios from 'axios'

import { DefaultBodyError } from '@/services/escopo-api/interfaces/errors'

export function extractApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      return error.message
    }

    return 'Um erro inesperado aconteceu.'
  }

  if (error.response?.status === 401) {
    return 'Sessão expirada, faça login novamente.'
  }

  if (error.response?.status === 422) {
    return 'Corpo da requisição inválido.'
  }

  const body = error.response?.data as DefaultBodyError

  return body?.mensagem ?? 'Erro ao efetuar requisição.'
}
