import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ProjectForm from '@/components/form/ProjectForm'
import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { STORAGE_KEYS } from '@/constants/storage'
import { useAlert } from '@/hooks/useAlert'
import { useAuth } from '@/hooks/useAuth'
import { criarProjetoData } from '@/schemas/form-projeto.schema'
import * as projetoService from '@/services/escopo-api/projeto'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function NewProject() {
  const router = useRouter()
  const { showAlert } = useAlert()
  const { logout } = useAuth()
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
      } catch (error) {
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
      router.push(`/projeto/${response.id}`)
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-5">
        <Text className="mb-6 font-inter-bold text-2xl text-cinza-700">Novo Projeto</Text>

        <ProjectForm
          mode="create"
          initialData={null}
          onSubmit={handleCriarProjeto}
          userEmail={userEmail}
          onError={(msg) => showAlert(msg, 'error')}
          stopLoading={stopLoading}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
