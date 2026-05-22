const API_URL = process.env.EXPO_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL não configurada, confira o arquivo .env')
}

export const ENV = {
  API_URL,
} as const
