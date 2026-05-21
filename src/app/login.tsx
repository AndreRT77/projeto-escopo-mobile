import AsyncStorage from '@react-native-async-storage/async-storage'
import { Link } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import LogoImg from '@/assets/images/logo.png'
import { Text } from '@/components/ui/Text'
import { STORAGE_KEYS } from '@/constants/storage'
import { useAuth } from '@/hooks/useAuth'
import * as apiAuth from '@/services/escopo-api/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()

  async function handleSubmit() {
    setError('')
    setLoading(true)

    try {
      const response = await apiAuth.login({
        email,
        senha: password,
      })

      console.log(response)

      if (!response?.token) {
        throw new Error('Resposta da API sem token. Tente novamente.')
      }

      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token)

      await AsyncStorage.setItem(
        STORAGE_KEYS.AUTH_USER,
        JSON.stringify(response.usuario ?? { email }),
      )

      login()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao efetuar login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      className="bg-fundo"
      contentContainerClassName="grow"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 items-center justify-center px-6 py-10">
        <Image source={LogoImg} resizeMode="contain" className="mb-10 h-24 w-72" />

        <View className="shadow-external w-full rounded-[36px] bg-white px-7 py-10">
          <Text className="font-inter-bold mb-8 text-center text-2xl text-base">
            Transforme ideias em requisitos bem definidos.
          </Text>

          <Text className="font-inter-bold text-cinza-700 mb-8 text-center text-3xl">Login</Text>

          {!!error && (
            <View className="mb-5 rounded-xl bg-red-100 px-4 py-3">
              <Text className="text-vermelho text-center">{error}</Text>
            </View>
          )}

          <View className="gap-5">
            <View>
              <Text className="font-inter-medium text-cinza-700 mb-2">E-mail</Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                className="border-cinza-300 font-inter text-cinza-700 rounded-lg border-2 px-4 py-4"
              />
            </View>

            <View>
              <Text className="font-inter-medium text-cinza-700 mb-2">Senha</Text>

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                className="border-cinza-300 font-inter text-cinza-700 rounded-lg border-2 px-4 py-4"
              />
            </View>

            <View className="items-end">
              <Link href="/senha">
                <Text className="font-inter-medium text-base text-sm">Esqueceu a senha?</Text>
              </Link>
            </View>

            <View className="mt-4 gap-3">
              <Link href="/cadastro" asChild>
                <TouchableOpacity className="border-base rounded-lg border-2 py-4">
                  <Text className="font-inter-semibold text-center text-base">Cadastre-se</Text>
                </TouchableOpacity>
              </Link>

              <TouchableOpacity
                disabled={loading}
                onPress={handleSubmit}
                className="bg-base items-center rounded-lg py-4 disabled:opacity-60"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="font-inter-semibold text-white">Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
