import { ENV } from '@/constants/env'
import { STORAGE_KEYS } from '@/constants/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

export const api = axios.create({
  baseURL: ENV.API_URL,
})

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)
