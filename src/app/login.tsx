import { zodResolver } from '@hookform/resolvers/zod'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Image, ScrollView, View } from 'react-native'

import LogoImg from '@/assets/images/logo-white.png'
import { LabelWithTextInput } from '@/components/form/LabelWithTextInput'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { STORAGE_KEYS } from '@/constants/storage'
import { useAlert } from '@/hooks/useAlert'
import { useAuth } from '@/hooks/useAuth'
import { LoginData, loginSchema } from '@/schemas/login.schema'
import * as auth from '@/services/escopo-api/auth'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

export default function Login() {
  const { login } = useAuth()
  const { email } = useLocalSearchParams<{ email?: string }>()
  const { showAlert } = useAlert()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  })

  useEffect(() => {
    if (!email || typeof email !== 'string') return

    reset({
      email,
      senha: '',
    })
  }, [email, reset])

  async function onSubmit({ email, senha }: LoginData) {
    try {
      const response = await auth.login({ email, senha })

      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token)
      await AsyncStorage.setItem(
        STORAGE_KEYS.AUTH_USER,
        JSON.stringify(response.usuario ?? { email }),
      )

      login()
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
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
          <Image source={LogoImg} resizeMode="contain" className="mb-2 h-24 w-72" />

          <View className="w-full rounded-[36px] bg-white px-7 py-10 shadow-external">
            <Text className="mb-8 text-center font-inter-bold text-2xl text-base">
              Transforme ideias em requisitos bem definidos.
            </Text>

            <Text className="mb-8 text-center font-inter-bold text-3xl text-cinza-700">Login</Text>

            <View className="gap-5">
              <LabelWithTextInput
                control={control}
                label="E-mail"
                name="email"
                keyboardType="email-address"
                placeholder="Digite seu e-mail"
              />

              <LabelWithTextInput
                control={control}
                name="senha"
                label="Senha"
                placeholder="Digite sua senha"
                secureTextEntry
              />

              <View className="items-end">
                <Link href={'/senha' as any}>
                  <Text className="font-inter-medium text-base text-sm">Esqueceu a senha?</Text>
                </Link>
              </View>

              <View className="mt-4 gap-3">
                <Link href="/cadastro" asChild>
                  <Button variant="outline">Cadastre-se</Button>
                </Link>

                <Button
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onPress={handleSubmit(onSubmit)}
                >
                  Entrar
                </Button>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}
