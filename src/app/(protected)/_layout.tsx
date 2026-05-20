import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator } from 'react-native'

import { useAuth } from '@/hooks/useAuth'

export default function ProtectedLayout() {
  const { isLoggedIn, isReady } = useAuth()

  if (!isReady) {
    return <ActivityIndicator className="grow items-center justify-center" />
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />
  }

  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
    </Stack>
  )
}
