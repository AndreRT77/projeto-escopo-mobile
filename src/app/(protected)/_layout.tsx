import { Redirect, Stack, router, usePathname } from 'expo-router'
import { Bell, LayoutDashboard, List, Settings } from 'lucide-react-native'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import LogoImg from '@/assets/images/logo-white.png'
import { Loading } from '@/components/ui/Loading'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedLayout() {
  const { isLoggedIn, isReady } = useAuth()
  const currentPath = usePathname()

  if (!isReady) {
    return <Loading />
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />
  }

  function handleNavigate(path: string) {
    if (router.canGoBack()) {
      router.dismissAll()
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
          headerShadowVisible: false,
          headerLeft: () => <Image source={LogoImg} resizeMode="contain" className="h-12 w-44" />,
          headerRight: () => (
            <View className="flex-row items-center gap-7">
              <TouchableOpacity
                onPress={() => handleNavigate('/notificacoes')}
                className="active:opacity-70"
              >
                <Bell color="white" size={24} strokeWidth={1.5} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleNavigate('/configuracao')}
                className="active:opacity-70"
              >
                <Settings color="white" size={24} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          ),
          headerBackVisible: false,
        }}
      />

      <View className="flex-row items-center justify-around border-t border-zinc-200 bg-white pb-6 pt-3 shadow-lg">
        <TouchableOpacity onPress={() => handleNavigate('/')} className="flex-1 items-center">
          <LayoutDashboard color={currentPath === '/' ? '#552BA9' : '#71717A'} size={24} />
          <Text
            className={`mt-1 text-xs font-medium ${
              currentPath === '/' ? 'font-bold text-[#552BA9]' : 'text-zinc-500'
            }`}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleNavigate('/projetos')}
          className="flex-1 items-center"
        >
          <List color={currentPath === '/projetos' ? '#552BA9' : '#71717A'} size={24} />
          <Text
            className={`mt-1 text-xs font-medium ${
              currentPath === '/projetos' ? 'font-bold text-[#552BA9]' : 'text-zinc-500'
            }`}
          >
            Lista de projetos
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
