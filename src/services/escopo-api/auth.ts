import { ENV } from '@/constants/env'

interface loginRequest {
  email: string
  senha: string
}

interface loginResponse {
  token: string
  usuario: {
    id: number
    nome: string
    email: string
  }
}

export async function login(body: loginRequest): Promise<loginResponse> {
  const response = await fetch(`${ENV.API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data: loginResponse = await response.json()

  return data
}
