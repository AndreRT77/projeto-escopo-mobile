import { STORAGE_KEYS } from '@/constants/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { createContext, PropsWithChildren, useEffect, useState } from 'react'

type AuthState = {
  isLoggedIn: boolean
  isReady: boolean
  login: () => void
  logout: () => void
}

export const AuthContext = createContext<AuthState>({} as AuthState)

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isReady, setIsReady] = useState(false)

  async function storageState(newState: { isLoggedIn: boolean }) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(newState))
    } catch (error) {
      console.log('ERROR_SET_STORAGE_AUTH:', error)
    }
  }

  function login() {
    setIsLoggedIn(true)
    storageState({ isLoggedIn: true })
    router.replace('/dashboard')
  }

  function logout() {
    setIsLoggedIn(false)
    storageState({ isLoggedIn: false })
    router.replace('/login')
  }

  useEffect(() => {
    async function loadStorageState() {
      try {
        const storedState = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_STATE)
        const state = storedState ? JSON.parse(storedState) : null

        setIsLoggedIn(state?.isLoggedIn ?? false)
      } catch (error) {
        console.log('ERROR_GET_STORAGE_AUTH:', error)
        setIsLoggedIn(false)
      } finally {
        setIsReady(true)
      }
    }

    loadStorageState()
  }, [])

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  )
}
