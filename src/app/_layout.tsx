import { Stack } from 'expo-router'

import { AlertProvider } from '@/contexts/AlertContext'
import { AuthProvider } from '@/contexts/authContext'

export default function Layout() {
  return (
    <AuthProvider>
      <AlertProvider>
        <Stack>
          <Stack.Screen name="(protected)" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="cadastro" options={{ headerShown: false, animation: 'none' }} />
        </Stack>
      </AlertProvider>
    </AuthProvider>
  )
}
