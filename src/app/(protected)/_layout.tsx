import { Redirect, Stack, router, usePathname } from 'expo-router'
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native'

import LogoImg from '@/assets/images/logo-white.png'
import { useAuth } from '@/hooks/useAuth'
import { Menu, X } from 'lucide-react-native'
import { useState } from 'react'

export default function ProtectedLayout() {
  const { isLoggedIn, isReady } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const currentPath = usePathname()

  const itensMenu = [
    { id: 1, nome: 'Dashboard', path: '/dashboard' },
    { id: 2, nome: 'Novo Projeto', path: '/novo-projeto' },
    { id: 3, nome: 'Lista de projetos', path: '/projetos' },
    { id: 4, nome: 'Notificações', path: '/notificacoes' },
    { id: 5, nome: 'Configurações', path: '/configuracao' },
  ]

  if (!isReady) {
    return <ActivityIndicator className="grow items-center justify-center" />
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />
  }

  const handleNavigate = (path: string) => {
    setMenuOpen(false)
    if (path === currentPath) {
      return
    }

    router.push(path)
  }

  return (
    <View className="flex-1">
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
          headerBackVisible: false,
        }}
      />

      {menuOpen && (
        <View className="absolute bottom-0 left-0 right-0 top-20 z-50 flex flex-col items-center justify-center gap-2 bg-[#552BA9]">
          {itensMenu.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleNavigate(item.path)}
              className="items-center py-2 active:opacity-70"
            >
              <Text className="p-3 text-xl font-semibold text-white">{item.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}
