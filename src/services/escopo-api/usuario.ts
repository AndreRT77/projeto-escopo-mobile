import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export async function updateName(nome: string) {
  const response = await api.patch(`${ENV.API_URL}/api/v1/usuario/nome`, { nome })

  return response.data
}

export async function updatePhoto(foto: any): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('foto', foto)

  const response = await api.patch(`${ENV.API_URL}/api/v1/usuario/foto-perfil`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

interface updatePasswordProps {
  senha_atual: string
  senha_nova: string
}

export async function updatePassword(body: updatePasswordProps) {
  const response = await api.patch(`${ENV.API_URL}/api/v1/usuario/senha`, body)

  return response.data
}

export async function deleteUser() {
  const response = await api.delete(`${ENV.API_URL}/api/v1/usuario`)

  return response.data
}

interface getUserByEmailResponse {
  id: 1
  nome: string
  email: string
  foto_perfil: string
}

export async function getUserByEmail(email: string): Promise<getUserByEmailResponse> {
  const response = await api.get(`${ENV.API_URL}/api/v1/usuario/email/${email}`)

  return response.data
}
