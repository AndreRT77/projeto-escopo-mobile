/*
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
*/

import LogoImg from '@/assets/images/logo.svg'
import { STORAGE_KEYS } from '@/constants/storage'
import * as apiAuth from '@/services/escopo-api/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    setLoading(true)

    try {
      const response = await apiAuth.login({ email, senha: password })

      const token = response?.token
      const usuario = response?.usuario

      if (!token) {
        throw new Error('Resposta da API sem token. Tente novamente.')
      }

      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(usuario || { email }))

      router.replace('/dashboard')
    } catch (error) {
      console.log(error)

      setError(error.message || 'Erro ao efetuar login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
      <View className="flex-1 items-center justify-center px-6 py-12">
        <View className="w-full max-w-7xl">
          <View className="mb-8 items-center">
            <Image source={LogoImg} className="h-32 w-32" resizeMode="contain" />
          </View>

          <View className="flex flex-col gap-8">
            <View className="w-full">
              <View className="rounded-[32px] bg-white p-6 shadow-lg">
                <Text className="mb-8 text-center text-xl font-bold text-[#552ba9]">
                  Transforme ideias em requisitos bem definidos.
                </Text>

                <Text className="mb-8 text-center text-2xl font-bold text-gray-900">Login</Text>

                {error ? (
                  <View className="mb-4 rounded-xl bg-red-100 px-4 py-3">
                    <Text className="text-sm text-red-700">{error}</Text>
                  </View>
                ) : null}

                <View className="gap-6">
                  <View>
                    <Text className="mb-2 font-medium text-gray-800">E-mail</Text>

                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Digite seu email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-700"
                    />
                  </View>

                  <View>
                    <Text className="mb-2 font-medium text-gray-800">Senha</Text>

                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Digite sua senha"
                      secureTextEntry
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-700"
                    />
                  </View>

                  <View className="items-end">
                    <Link href="/senha" asChild>
                      <TouchableOpacity>
                        <Text className="text-sm font-medium text-[#552ba9]">
                          Esqueceu a senha?
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  </View>

                  <View className="flex flex-col gap-4 pt-4">
                    <Link href="/cadastro" asChild>
                      <TouchableOpacity className="rounded-lg border-2 border-[#552ba9] bg-white py-3">
                        <Text className="text-center font-semibold text-[#552ba9]">
                          Cadastre-se
                        </Text>
                      </TouchableOpacity>
                    </Link>

                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={loading}
                      className="items-center justify-center rounded-lg bg-[#552ba9] py-3 disabled:opacity-60"
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="font-semibold text-white">Entrar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
