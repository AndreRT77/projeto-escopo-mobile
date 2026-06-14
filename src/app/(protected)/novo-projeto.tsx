import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { STORAGE_KEYS } from '@/constants/storage'
import { useAlert } from '@/hooks/useAlert'
import { useAuth } from '@/hooks/useAuth'
import { criarProjetoData } from '@/schemas/form-projeto.schema'
import * as projetoService from '@/services/escopo-api/projeto'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'
import CreateProjectForm from '@/components/form/project/CreateProjectForm'

export default function NewProject() {
  const router = useRouter()
  const { showAlert } = useAlert()
  const { logout } = useAuth()
  const insets = useSafeAreaInsets()
  const scrollViewPadding = {
    paddingTop: 20,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }

  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  function stopLoading() {
    setLoading(false)
  }

  useEffect(() => {
    async function obterEmail() {
      try {
        const usuarioString = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER)

        if (!usuarioString) {
          showAlert('Usuário não encontrado. Por favor, faça login novamente.', 'error')
          logout()
          return
        }

        const usuarioLogado = JSON.parse(usuarioString)
        const emailLogado = usuarioLogado.email

        setUserEmail(emailLogado)
      } catch {
        logout()
      } finally {
        stopLoading()
      }
    }

    obterEmail()
  }, [])

  async function handleCriarProjeto(formData: criarProjetoData) {
    try {
      const response = await projetoService.criarProjeto(formData)
      showAlert('Projeto criado com sucesso!', 'success')
      router.replace(`/projeto/${response.id}`)
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-5" contentContainerStyle={scrollViewPadding}>
        <Text className="mb-6 font-inter-bold text-2xl text-cinza-700">Novo Projeto</Text>

        <CreateProjectForm
          onSubmit={handleCriarProjeto}
          userEmail={userEmail}
          onError={(msg) => showAlert(msg, 'error')}
          stopLoading={stopLoading}
        />
      </ScrollView>
    </View>
  )
}
