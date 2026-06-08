import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronsLeft, History, MessagesSquare, Save } from 'lucide-react-native'
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
import Comentarios from '@/components/pages/documento/Comentarios'
import { Versionamento } from '@/components/pages/documento/Versionamento'
import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import * as documentoService from '@/services/escopo-api/documento'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

const PURPLE = '#552BA9'
const LIGHT_PURPLE = '#B79BE8'

function formatDate(date?: string) {
  if (!date) return '---'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return '---'
  }

  return parsedDate.toLocaleDateString('pt-BR')
}

export default function Documento() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { showAlert } = useAlert()

  const documentoId = useMemo(() => {
    const id = params.id

    return Array.isArray(id) ? id[0] : id
  }, [params.id])

  const [documento, setDocumento] = useState<documentoService.DetalhesDocumento | null>(null)
  const [versoes, setVersoes] = useState<documentoService.VersaoMin[]>([])

  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [editingTitle, setEditingTitle] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)

  useEffect(() => {
    async function loadDocumento() {
      if (!documentoId) {
        showAlert('Documento inválido.', 'error')
        setLoading(false)
        return
      }

      try {
        const [documentoData, versoesData] = await Promise.all([
          documentoService.obterDetalhesDeUmDocumento(documentoId),
          documentoService.obterHistoricoDeVersoes(documentoId).catch(() => []),
        ])

        setDocumento(documentoData)
        setTitulo(documentoData.titulo)
        setConteudo(documentoData.conteudo || '')
        setVersoes(versoesData)
      } catch (error) {
        showAlert(extractApiErrorMessage(error), 'error')
      } finally {
        setLoading(false)
      }
    }

    loadDocumento()
  }, [documentoId, showAlert])

  async function refreshDocumento() {
    if (!documentoId) return

    const [documentoData, versoesData] = await Promise.all([
      documentoService.obterDetalhesDeUmDocumento(documentoId),
      documentoService.obterHistoricoDeVersoes(documentoId).catch(() => []),
    ])

    setDocumento(documentoData)
    setTitulo(documentoData.titulo)
    setConteudo(documentoData.conteudo || '')
    setVersoes(versoesData)
  }

  async function handleSave() {
    if (!documentoId || !documento) return

    const trimmedTitle = titulo.trim()
    const titleChanged = trimmedTitle !== documento.titulo
    const contentChanged = conteudo !== (documento.conteudo || '')

    if (!trimmedTitle) {
      showAlert('O título do documento não pode ficar vazio.', 'error')
      return
    }

    if (contentChanged && !conteudo.trim()) {
      showAlert('O conteúdo do documento não pode ficar vazio.', 'error')
      return
    }

    if (!titleChanged && !contentChanged) {
      setEditingTitle(false)
      setEditingContent(false)
      return
    }

    try {
      setSaving(true)

      if (titleChanged) {
        await documentoService.atualizarTitulo(documentoId, { titulo: trimmedTitle })
      }

      if (contentChanged) {
        await documentoService.adicionarNovaVersaoDeUmDocumento(documentoId, { conteudo })
      }

      await refreshDocumento()
      setEditingTitle(false)
      setEditingContent(false)
      showAlert('Documento salvo com sucesso!', 'success')
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function carregarVersoes() {
    if (!documentoId) return []

    try {
      const versoesData = await documentoService.obterHistoricoDeVersoes(documentoId)
      setVersoes(versoesData || [])

      return versoesData || []
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')

      return []
    }
  }

  async function abrirHistorico() {
    await carregarVersoes()
    setHistoryOpen(true)
  }

  if (loading) {
    return <Loading />
  }

  if (!documento) {
    return (
      <SafeAreaView className="flex-1 bg-white px-4 pt-4">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 justify-center">
          <ChevronsLeft size={34} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center">
          <Text className="font-inter-bold text-xl text-cinza-700">Documento não encontrado</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (commentsOpen) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Comentarios
          documentoId={documentoId}
          onVoltar={() => setCommentsOpen(false)}
          onErro={(mensagem) => showAlert(mensagem, 'error')}
        />
      </SafeAreaView>
    )
  }

  const createdAt = versoes.length > 0 ? versoes[versoes.length - 1].criado_em : undefined
  const hasChanges = titulo.trim() !== documento.titulo || conteudo !== (documento.conteudo || '')

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 px-4 pt-3">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center"
            >
              <ChevronsLeft size={34} color="#111827" strokeWidth={2.5} />
            </TouchableOpacity>

            {editingTitle ? (
              <TextInput
                value={titulo}
                onChangeText={setTitulo}
                autoFocus
                className="ml-2 h-8 flex-1 rounded border border-cinza-600 px-1 py-0 font-inter-bold text-2xl text-black"
                selectionColor={PURPLE}
              />
            ) : (
              <TouchableOpacity
                onPress={() => setEditingTitle(true)}
                className="ml-2 flex-1 justify-center"
              >
                <Text className="font-inter-bold text-2xl text-black" numberOfLines={1}>
                  {titulo}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="mt-1 border-b border-cinza-400 pb-1">
            <View className="flex-row items-end justify-between">
              <View className="flex-1 pr-3">
                <Text className={`text-sm ${hasChanges ? 'text-alert' : 'text-[#B79BE8]'}`}>
                  {hasChanges
                    ? 'Alterações não salvas!'
                    : `Última Alteração: ${formatDate(documento.ultima_alteracao)}`}
                </Text>
                <Text className="text-sm text-black">Data de criação: {formatDate(createdAt)}</Text>
              </View>

              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  onPress={abrirHistorico}
                  className="h-11 w-11 items-center justify-center"
                >
                  <History size={43} color={LIGHT_PURPLE} strokeWidth={2.1} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCommentsOpen(true)}
                  className="h-10 w-10 items-center justify-center rounded-lg bg-base"
                >
                  <MessagesSquare size={27} color="#FFFFFF" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="mt-3 flex-1 rounded-2xl border border-cinza-300 bg-white p-4">
            {editingContent ? (
              <TextInput
                value={conteudo}
                onChangeText={setConteudo}
                multiline
                textAlignVertical="top"
                selectionColor={PURPLE}
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
                    emptyMessage="Este documento ainda não possui conteúdo."
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

      {historyOpen && (
        <Versionamento
          versoes={versoes}
          titulo={titulo}
          onFechar={() => setHistoryOpen(false)}
          onErro={(mensagem) => showAlert(mensagem, 'error')}
        />
      )}
    </SafeAreaView>
  )
}
