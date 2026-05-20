import { useAuth } from '@/hooks/useAuth'
import { Button, Text, View } from 'react-native'

export default function Login() {
  const { login } = useAuth()

  return (
    <View className="grow items-center justify-center bg-slate-400">
      <Text className="text-xl font-bold text-white">Este é o Login!</Text>
      <Button title="Entrar" onPress={login} />
    </View>
  )
}
