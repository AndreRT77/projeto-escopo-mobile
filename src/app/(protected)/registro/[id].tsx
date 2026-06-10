import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronsLeft, Save } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import MarkdownRenderer from '@/components/MarkdownRenderer'
import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import * as registroService from '@/services/escopo-api/registro'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

const PURPLE = '#552BA9'

function formatDate(date?: string) {
  if (!date) return '---'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return '---'
  }

  return parsedDate.toLocaleDateString('pt-BR')
}

export default function Registro() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { showAlert } = useAlert()

  const registroId = useMemo(() => {
    const id = params.id

    return Array.isArray(id) ? id[0] : id
  }, [params.id])

  const [registro, setRegistro] = useState<registroService.Registro | null>(null)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingContent, setEditingContent] = useState(false)

  useEffect(() => {
    async function carregarRegistro() {
      if (!registroId) {
        showAlert('Registro inválido.', 'error')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const registroData = await registroService.obterDetalhesDeUmRegistro(registroId)

        setRegistro(registroData)
        setTitulo(registroData.titulo)
        setConteudo(registroData.conteudo || '')
      } catch (error) {
        showAlert(extractApiErrorMessage(error), 'error')
      } finally {
        setLoading(false)
      }
    }

    carregarRegistro()
  }, [registroId, showAlert])

  async function refreshRegistro() {
    if (!registroId) return

    const registroData = await registroService.obterDetalhesDeUmRegistro(registroId)

    setRegistro(registroData)
    setTitulo(registroData.titulo)
    setConteudo(registroData.conteudo || '')
  }

  async function handleSave() {
    if (!registroId || !registro) return

    const trimmedTitle = titulo.trim()
    const titleChanged = trimmedTitle !== registro.titulo
    const contentChanged = conteudo !== (registro.conteudo || '')

    if (!trimmedTitle) {
      showAlert('O título do registro não pode ficar vazio.', 'error')
      return
    }

    if (!titleChanged && !contentChanged) {
      setEditingContent(false)
      return
    }

    try {
      setSaving(true)

      if (titleChanged) {
        await registroService.atualizarTitulo(registroId, { titulo: trimmedTitle })
      }

      if (contentChanged) {
        await registroService.atualizarConteudo(registroId, { conteudo })
      }

      await refreshRegistro()
      setEditingContent(false)
      showAlert('Registro salvo com sucesso!', 'success')
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  if (!registro) {
    return (
      <SafeAreaView className="flex-1 bg-white px-4 pt-4">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 justify-center">
          <ChevronsLeft size={34} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center">
          <Text className="font-inter-bold text-xl text-cinza-700">Registro não encontrado</Text>
        </View>
      </SafeAreaView>
    )
  }

  const hasChanges = titulo.trim() !== registro.titulo || conteudo !== (registro.conteudo || '')

  return (
    <SafeAreaView className="flex-1 bg-fundo">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 px-4 pt-3">
          <View className="relative z-10 border-b border-cinza-400 pb-2">
            <View className="mb-2 flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center"
              >
                <ChevronsLeft size={34} color="#111827" strokeWidth={2.5} />
              </TouchableOpacity>

              <TextInput
                value={titulo}
                onChangeText={setTitulo}
                className="max-w-[310px] flex-1 rounded border border-transparent px-1 py-0 font-inter-bold text-2xl text-black"
                selectionColor={PURPLE}
              />
            </View>

            <Text className={`text-sm ${hasChanges ? 'text-alert' : 'text-variant'}`}>
              {hasChanges
                ? 'Alterações não salvas!'
                : `Última Alteração: ${formatDate(registro.atualizado_em)}`}
            </Text>
            <Text className="text-sm text-black">
              Data de criação: {formatDate(registro.criado_em)}
            </Text>
          </View>

          <View className="relative z-0 mt-3 flex-1 rounded-2xl border border-cinza-300 bg-white px-4 py-4">
            {editingContent ? (
              <TextInput
                value={conteudo}
                onChangeText={setConteudo}
                multiline
                textAlignVertical="top"
                selectionColor={PURPLE}
                placeholder="Este registro ainda não possui conteúdo."
                placeholderTextColor="#6B7280"
                className="flex-1 p-0 font-inter text-base leading-6 text-black"
              />
            ) : (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setEditingContent(true)}
                className="flex-1"
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerClassName={hasChanges ? 'pb-20' : ''}
                >
                  <MarkdownRenderer
                    valor={conteudo}
                    emptyMessage="Este registro ainda não possui conteúdo."
                  />
                </ScrollView>
              </TouchableOpacity>
            )}

            {hasChanges && (
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="absolute bottom-4 right-3 flex-row items-center gap-2 rounded-lg bg-base px-5 py-3 disabled:opacity-60"
              >
                <Save size={22} color="#FFFFFF" strokeWidth={2} />
                <Text className="font-inter-semibold text-base text-white">
                  {saving ? 'Salvando' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
