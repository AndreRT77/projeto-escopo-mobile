import { zodResolver } from '@hookform/resolvers/zod'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, router } from 'expo-router'
import { Undo2 } from 'lucide-react-native'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Image, ScrollView, View } from 'react-native'

import LogoImg from '@/assets/images/logo-white.png'
import { LabelWithTextInput } from '@/components/form/LabelWithTextInput'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { RegisterData, registerSchema } from '@/schemas/register.schema'
import * as auth from '@/services/escopo-api/auth'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

export default function Cadastro() {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: '', email: '', senha: '' },
  })

  const [error, setError] = useState('')

  async function onSubmit({ nome, email, senha }: RegisterData) {
    setError('')

    try {
      const response = await auth.register({
        nome,
        email,
        senha,
      })

      router.replace({
        pathname: '/login',
        params: {
          email: response.email,
        },
      })
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
      <Alert visible={!!error} message={error} onClose={() => setError('')} position="top" />

      <ScrollView contentContainerClassName="grow" keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-10">
          <View className="items-center">
            <Image source={LogoImg} resizeMode="contain" className="mb-2 h-24 w-72" />
          </View>

          <View className="rounded-[36px] bg-white px-7 py-10 shadow-external">
            <Text className="mb-6 text-center font-inter-bold text-2xl text-base">
              Transforme ideias em requisitos bem definidos.
            </Text>

            <Text className="mb-4 text-center font-inter-bold text-3xl text-cinza-700">
              Cadastro
            </Text>

            <View className="gap-5">
              <LabelWithTextInput
                control={control}
                name="nome"
                label="Nome"
                placeholder="Digite seu nome"
              />

              <LabelWithTextInput
                control={control}
                name="email"
                label="E-mail"
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

              <View className="mt-5 gap-3">
                <Link href="/login" asChild>
                  <Button variant="outline">
                    <View className="flex-row items-center gap-2">
                      <Text>Voltar</Text>
                      <Undo2 size={18} />
                    </View>
                  </Button>
                </Link>

                <Button
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onPress={handleSubmit(onSubmit)}
                >
                  Cadastrar
                </Button>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}
