import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ProjectForm, { Integrante } from '@/components/form/ProjectForm'
import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { STORAGE_KEYS } from '@/constants/storage'
import { useAlert } from '@/hooks/useAlert'
import { useAuth } from '@/hooks/useAuth'
import * as projetoService from '@/services/escopo-api/projeto'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

export interface FormDataToUpdate {
  titulo: string
  descricao: string
  integrantesAtuais: Integrante[]
  integrantesExcluidos: (string | number)[]
  integrantesAdicionais: Integrante[]
  pendentes: Integrante[]
  convitesExcluidos: (string | number)[]
}

export default function EditProject() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { showAlert } = useAlert()
  const { logout } = useAuth()
  const insets = useSafeAreaInsets()
  const scrollViewPadding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }

  // Estados
  const [projectData, setProjectData] = useState<projetoService.DetalhesDoProjeto | null>(null)
  const [userEmail, setUserEmail] = useState('')

  // Controle de Loading
  const [isFetchingData, setIsFetchingData] = useState(true)
  const [isFormReady, setIsFormReady] = useState(false)

  useEffect(() => {
    async function inicializarDados() {
      try {
        const usuarioString = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER)

        if (!usuarioString) {
          showAlert('Usuário não encontrado. Por favor, faça login novamente.', 'error')
          logout()
          return
        }

        const usuarioLogado = JSON.parse(usuarioString)
        setUserEmail(usuarioLogado.email)

        if (id) {
          const response = await projetoService.obterDetalhesDoProjetoPorId(id)
          setProjectData(response)
        }
      } catch (error) {
        showAlert(extractApiErrorMessage(error), 'error')
      } finally {
        setIsFetchingData(false)
      }
    }

    inicializarDados()
  }, [id])

  function estruturarPayloadAtualizacao(
    formData: FormDataToUpdate,
  ): projetoService.AtualizarProjeto {
    const integrantesAtuais = formData.integrantesAtuais.map((integrante) => ({
      usuario_projeto_id: Number(integrante.usuario_projeto_id),
      nivel_acesso_id: Number(integrante.nivel_acesso_id),
    }))

    const integrantesExcluidos = formData.integrantesExcluidos.map((integranteId) => ({
      usuario_projeto_id: Number(integranteId),
    }))

    const convitesAdicionais = formData.integrantesAdicionais.map((integrante) => ({
      usuario_id: Number(integrante.id),
      nivel_acesso_id: Number(integrante.nivel_acesso_id),
    }))

    const convitesPendentes = formData.pendentes.map((convite) => ({
      convite_id: Number(convite.convite_id),
      nivel_acesso_id: Number(convite.nivel_acesso_id),
    }))

    const convitesExcluidos = formData.convitesExcluidos.map((conviteId) => ({
      convite_id: Number(conviteId),
    }))

    const payload: projetoService.AtualizarProjeto = {
      titulo: formData.titulo,
      descricao: formData.descricao,
    }

    if (integrantesAtuais.length || integrantesExcluidos.length) {
      payload.integrantes = {}
      if (integrantesAtuais.length) payload.integrantes.atuais = integrantesAtuais
      if (integrantesExcluidos.length) payload.integrantes.excluidos = integrantesExcluidos
    }

    if (convitesAdicionais.length || convitesPendentes.length || convitesExcluidos.length) {
      payload.convites = {}
      if (convitesAdicionais.length) payload.convites.adicionais = convitesAdicionais
      if (convitesPendentes.length) payload.convites.pendentes = convitesPendentes
      if (convitesExcluidos.length) payload.convites.excluidos = convitesExcluidos
    }

    return payload
  }

  async function handleAtualizarProjeto(formData: FormDataToUpdate) {
    const payload = estruturarPayloadAtualizacao(formData)

    try {
      await projetoService.atualizarProjeto(id, payload)
      showAlert('Projeto atualizado com sucesso!', 'success')
      router.push(`/projeto/${id}`)
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    }
  }

  const isPageLoading = isFetchingData || (!isFormReady && projectData !== null)

  return (
    <View className="flex-1 bg-white">
      {isPageLoading && <Loading />}

      {!isFetchingData && projectData && userEmail ? (
        <ScrollView
          contentContainerStyle={scrollViewPadding}
          style={{ display: isFormReady ? 'flex' : 'none' }}
          className="flex-1 px-5 py-4"
        >
          <View className="mb-6 mt-2">
            <Text className="font-inter-bold text-3xl text-cinza-700">Editar Projeto</Text>
          </View>

          <ProjectForm
            mode="edit"
            initialData={projectData}
            onSubmit={handleAtualizarProjeto}
            userEmail={userEmail}
            projectId={id}
            onError={(msg) => showAlert(msg, 'error')}
            stopLoading={() => setIsFormReady(true)}
          />
        </ScrollView>
      ) : null}
    </View>
  )
}
