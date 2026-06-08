import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ChevronsLeft,
  GitBranch,
  History,
  MessagesSquare,
  RotateCcw,
  Save,
  X,
} from 'lucide-react-native'
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

import Comentarios from '@/components/pages/projeto/Comentarios'
import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import * as comentarioService from '@/services/escopo-api/comentario'
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

function contentBlocks(conteudo: string) {
  const blocks = conteudo
    .split(/\n+/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length > 0) {
    return blocks
  }

  return ['Este documento ainda não possui conteúdo.']
}

function DocumentContent({
  conteudo,
  compact = false,
  tone = 'default',
}: {
  conteudo: string
  compact?: boolean
  tone?: 'default' | 'positive' | 'negative'
}) {
  const colorClass =
    tone === 'positive' ? 'text-verde' : tone === 'negative' ? 'text-alert' : 'text-black'
  const titleClass = compact ? 'text-sm' : 'text-base'
  const paragraphClass = compact ? 'text-xs leading-4' : 'text-base leading-6'

  return (
    <View>
      {contentBlocks(conteudo).map((block, index) => {
        const requirementMatch = block.match(/^(\d+\.\d+[:.)]?)\s*(.*)$/)

        if (requirementMatch) {
          return (
            <View key={`${block}-${index}`} className={`${index === 0 ? '' : 'mt-4'} flex-row`}>
              <Text className={`${paragraphClass} w-10 ${colorClass}`}>{requirementMatch[1]}</Text>
              <Text className={`${paragraphClass} flex-1 ${colorClass}`}>
                {requirementMatch[2]}
              </Text>
            </View>
          )
        }

        return (
          <Text
            key={`${block}-${index}`}
            className={`${index === 0 ? '' : compact ? 'mt-3' : 'mt-5'} ${titleClass} ${colorClass}`}
          >
            {block}
          </Text>
        )
      })}
    </View>
  )
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
  const [comentarios, setComentarios] = useState<comentarioService.Comentario[]>([])

  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)
  const [loadingVersionId, setLoadingVersionId] = useState<number | null>(null)

  const [editingTitle, setEditingTitle] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [versionPreviewOpen, setVersionPreviewOpen] = useState(false)
  const [previewVersion, setPreviewVersion] = useState<documentoService.DetalhesVersao | null>(null)
  const [previousPreviewVersion, setPreviousPreviewVersion] =
    useState<documentoService.DetalhesVersao | null>(null)
  const [previewVersionNumber, setPreviewVersionNumber] = useState<number | null>(null)
  const [previousPreviewVersionNumber, setPreviousPreviewVersionNumber] = useState<number | null>(
    null,
  )

  useEffect(() => {
    async function loadDocumento() {
      if (!documentoId) {
        showAlert('Documento inválido.', 'error')
        setLoading(false)
        return
      }

      try {
        const [documentoData, versoesData, comentariosData] = await Promise.all([
          documentoService.obterDetalhesDeUmDocumento(documentoId),
          documentoService.obterHistoricoDeVersoes(documentoId).catch(() => []),
          comentarioService.obterComentariosDeUmDocumento(documentoId).catch(() => []),
        ])

        setDocumento(documentoData)
        setTitulo(documentoData.titulo)
        setConteudo(documentoData.conteudo || '')
        setVersoes(versoesData)
        setComentarios(comentariosData)
      } catch (error) {
        showAlert(extractApiErrorMessage(error), 'error')
      } finally {
        setLoading(false)
      }
    }

    loadDocumento()
  }, [documentoId])

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

  async function refreshComentarios() {
    if (!documentoId) return

    const comentariosData = await comentarioService.obterComentariosDeUmDocumento(documentoId)
    setComentarios(comentariosData)
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

  async function handleCriarComentario(conteudoComentario: string) {
    if (!documentoId) return

    try {
      setSendingComment(true)
      await comentarioService.criarComentarioEmUmDocumento(documentoId, {
        conteudo: conteudoComentario,
        comentario_tipo_id: 1,
        parent_id: null,
        registro_referencia_id: null,
      })

      await refreshComentarios()
      showAlert('Comentário enviado com sucesso!', 'success')
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
      throw error
    } finally {
      setSendingComment(false)
    }
  }

  async function openVersionPreview(versao: documentoService.VersaoMin, index: number) {
    try {
      setLoadingVersionId(versao.id)

      const previous = versoes[index + 1]
      const [currentVersion, previousVersion] = await Promise.all([
        documentoService.obterDetalhesDeUmaVersao(versao.id),
        previous
          ? documentoService.obterDetalhesDeUmaVersao(previous.id).catch(() => null)
          : Promise.resolve(null),
      ])

      setPreviewVersion(currentVersion)
      setPreviousPreviewVersion(previousVersion)
      setPreviewVersionNumber(versoes.length - index)
      setPreviousPreviewVersionNumber(previous ? versoes.length - (index + 1) : null)
      setHistoryOpen(false)
      setVersionPreviewOpen(true)
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    } finally {
      setLoadingVersionId(null)
    }
  }

  function applyPreviewVersion() {
    if (!previewVersion) return

    setTitulo(previewVersion.titulo)
    setConteudo(previewVersion.conteudo || '')
    setVersionPreviewOpen(false)
    setEditingContent(true)
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
          comentarios={comentarios}
          enviando={sendingComment}
          onCriarComentario={handleCriarComentario}
          onVoltar={() => setCommentsOpen(false)}
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
                  onPress={() => setHistoryOpen(true)}
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
                onLongPress={() => setEditingContent(true)}
                className="flex-1"
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerClassName={hasChanges ? 'pb-20' : ''}
                >
                  <DocumentContent conteudo={conteudo} />
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
        <View className="absolute inset-0 z-20 bg-black/20 px-6 pt-24">
          <View
            className="rounded-2xl bg-white px-5 pb-4 pt-3"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <View className="mb-3 flex-row items-center justify-center">
              <Text className="font-inter-semibold text-lg text-black">Histórico de Versões</Text>
              <TouchableOpacity
                onPress={() => setHistoryOpen(false)}
                className="absolute right-0 h-8 w-8 items-center justify-center"
              >
                <X size={28} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              {versoes.length === 0 ? (
                <Text className="text-sm text-cinza-500">Nenhuma versão encontrada.</Text>
              ) : (
                versoes.map((versao, index) => {
                  const versionNumber = versoes.length - index
                  const isLoading = loadingVersionId === versao.id

                  return (
                    <TouchableOpacity
                      key={versao.id}
                      onPress={() => openVersionPreview(versao, index)}
                      disabled={isLoading}
                      className="flex-row items-center justify-between"
                    >
                      <Text
                        className={`flex-1 text-base ${index === 0 ? '' : 'text-cinza-500'}`}
                        style={{ color: index === 0 ? PURPLE : undefined }}
                        numberOfLines={1}
                      >
                        {titulo} - V{versionNumber} - {formatDate(versao.criado_em)}
                      </Text>
                      {index === 0 ? (
                        <X size={22} color="#1F2937" />
                      ) : (
                        <GitBranch size={22} color={PURPLE} />
                      )}
                    </TouchableOpacity>
                  )
                })
              )}
            </View>
          </View>
        </View>
      )}

      {versionPreviewOpen && previewVersion && (
        <View className="absolute inset-0 z-30 bg-black/20 px-4 pt-14">
          <View
            className="max-h-[86%] rounded-xl bg-white px-5 pb-6 pt-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 9,
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="mb-4 text-center text-base" style={{ color: PURPLE }}>
                {previewVersion.titulo} - v{previewVersionNumber ?? ''} -{' '}
                {formatDate(previewVersion.criado_em)}
              </Text>

              <View className="max-h-60 rounded-xl border border-cinza-400 p-2">
                <ScrollView nestedScrollEnabled>
                  <DocumentContent conteudo={previewVersion.conteudo || ''} compact />
                </ScrollView>
              </View>

              {previousPreviewVersion && (
                <>
                  <Text className="mb-4 mt-8 text-center text-base" style={{ color: PURPLE }}>
                    {previousPreviewVersion.titulo} - v{previousPreviewVersionNumber ?? ''} -{' '}
                    {formatDate(previousPreviewVersion.criado_em)}
                  </Text>

                  <View className="max-h-44 rounded-xl border border-cinza-400 p-2">
                    <ScrollView nestedScrollEnabled>
                      <DocumentContent
                        conteudo={previousPreviewVersion.conteudo || ''}
                        compact
                        tone="negative"
                      />
                    </ScrollView>
                  </View>
                </>
              )}
            </ScrollView>

            <View className="mt-5 flex-row justify-center gap-3">
              <TouchableOpacity
                onPress={() => setVersionPreviewOpen(false)}
                className="flex-row items-center gap-2 rounded-lg border border-cinza-300 px-5 py-3"
              >
                <Text className="font-inter-medium text-base" style={{ color: PURPLE }}>
                  Voltar
                </Text>
                <RotateCcw size={22} color={PURPLE} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={applyPreviewVersion}
                className="rounded-lg bg-base px-5 py-3"
              >
                <Text className="font-inter-medium text-base text-white">Usar versão</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}
