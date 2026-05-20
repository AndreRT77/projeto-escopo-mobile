import { Button, Text, View } from 'react-native'
import '../../global.css'

import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const { logout } = useAuth()

  return (
    <View className="grow items-center justify-center bg-green-400">
      <Text className="text-xl font-bold text-white">Este é o Dashboard!</Text>
      <Button title="Sair" onPress={logout} />
    </View>
  )
}
