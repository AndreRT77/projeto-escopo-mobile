import { zodResolver } from '@hookform/resolvers/zod'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import LogoImg from '@/assets/images/logo-white.png'
import { Text } from '@/components/ui/Text'
import { STORAGE_KEYS } from '@/constants/storage'
import { useAuth } from '@/hooks/useAuth'
import { LoginData, loginSchema } from '@/schemas/login.schema'
import * as auth from '@/services/escopo-api/auth'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

export default function Login() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const [error, setError] = useState('')

  const { login } = useAuth()

  async function onSubmit({ email, senha }: LoginData) {
    setError('')

    try {
      const response = await auth.login({ email, senha })

      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token)
      await AsyncStorage.setItem(
        STORAGE_KEYS.AUTH_USER,
        JSON.stringify(response.usuario ?? { email }),
      )

      login()
    } catch (err) {
      setError(extractApiErrorMessage(err))
    }
  }

  return (
    <LinearGradient
      colors={['#7E22CE', '#552BA9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="flex-1"
    >
      <ScrollView contentContainerClassName="grow" keyboardShouldPersistTaps="handled">
        <View className="flex-1 items-center justify-center px-6 py-10">
          <Image source={LogoImg} resizeMode="contain" className="mb-10 h-24 w-72" />

          <View className="w-full rounded-[36px] bg-white px-7 py-10 shadow-external">
            <Text className="mb-8 text-center font-inter-bold text-2xl text-base">
              Transforme ideias em requisitos bem definidos.
            </Text>

            <Text className="mb-8 text-center font-inter-bold text-3xl text-cinza-700">Login</Text>

            {!!error && (
              <View className="mb-5 rounded-xl bg-red-100 px-4 py-3">
                <Text className="text-center text-vermelho">{error}</Text>
              </View>
            )}

            <View className="gap-5">
              <>
                <Text className="mb-2 font-inter-medium text-cinza-700">E-mail</Text>

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Digite seu e-mail"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="rounded-lg border-2 border-cinza-300 px-4 py-4 font-inter text-cinza-700"
                    />
                  )}
                />

                {errors.email && (
                  <Text className="mt-1 text-sm text-red-500">{errors.email.message}</Text>
                )}
              </>

              <>
                <Text className="mb-2 font-inter-medium text-cinza-700">Senha</Text>

                <Controller
                  control={control}
                  name="senha"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder="Digite sua senha"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      className="rounded-lg border-2 border-cinza-300 px-4 py-4 font-inter text-cinza-700"
                    />
                  )}
                />

                {errors.senha && (
                  <Text className="mt-1 text-sm text-red-500">{errors.senha.message}</Text>
                )}
              </>

              <View className="items-end">
                <Link href="/senha">
                  <Text className="font-inter-medium text-base text-sm">Esqueceu a senha?</Text>
                </Link>
              </View>

              <View className="mt-4 gap-3">
                <Link href="/cadastro" asChild>
                  <TouchableOpacity className="rounded-lg border-2 border-base py-4">
                    <Text className="text-center font-inter-semibold text-base">Cadastre-se</Text>
                  </TouchableOpacity>
                </Link>

                <TouchableOpacity
                  disabled={isSubmitting}
                  onPress={handleSubmit(onSubmit)}
                  className="items-center rounded-lg bg-base py-4 disabled:opacity-60"
                >
                  {isSubmitting ? (
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
    </LinearGradient>
  )
}
