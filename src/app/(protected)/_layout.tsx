import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, Image, TouchableOpacity } from 'react-native'

import LogoImg from '@/assets/images/logo-white.png'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X } from 'lucide-react-native'
import { useState } from 'react'

export default function ProtectedLayout() {
  const { isLoggedIn, isReady } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!isReady) {
    return <ActivityIndicator className="grow items-center justify-center" />
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />
  }

  return (
    <Stack
      screenOptions={{
        title: '',
        headerStyle: {
          backgroundColor: '#552BA9',
        },
        headerLeft: () => <Image source={LogoImg} resizeMode="contain" className="h-12 w-44" />,
        headerRight: () => (
          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X color="white" /> : <Menu color="white" />}
          </TouchableOpacity>
        ),
        headerBackVisible: true,
      }}
    ></Stack>
  )
}
