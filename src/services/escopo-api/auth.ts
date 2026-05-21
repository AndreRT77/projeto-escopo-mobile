import axios from 'axios'

import { ENV } from '@/constants/env'

interface LoginRequest {
  email: string
  senha: string
}

interface LoginResponse {
  token: string
  usuario: {
    id: number
    nome: string
    email: string
  }
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(`${ENV.API_URL}/api/v1/auth/login`, body)

  return response.data
}
