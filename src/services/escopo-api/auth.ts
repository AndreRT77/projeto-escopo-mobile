import axios from 'axios'
// import type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

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
  const { data } = await axios.post<LoginResponse>(`${ENV.API_URL}/api/v1/auth/login`, body)

  return data
}

// export async function login(
//   body: LoginRequest,
// ): Promise<LoginResponse> | Promise<ErrorBodyDefault> | Promise<UnprocessableEntity> {
//   const response = await fetch(`${ENV.API_URL}/api/v1/auth/login`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(body),
//   })

//   if (!response.ok) {
//     console.log(response)
//   }

//   const data: LoginResponse = await response.json()

//   return data
// }
