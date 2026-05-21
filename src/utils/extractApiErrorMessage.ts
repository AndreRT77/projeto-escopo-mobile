import { DefaultBodyError } from '@/services/escopo-api/interfaces/errors'
import axios from 'axios'

export function extractApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      return error.message
    }

    return 'Um erro inesperado aconteceu.'
  }

  if (error.response?.status === 422) {
    return 'Corpo da requisição inválido.'
  }

  const body = error.response?.data as DefaultBodyError

  return body?.mensagem ?? 'Erro ao efetuar requisição.'
}
