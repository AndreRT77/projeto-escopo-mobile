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
import * as projetoService from '@/services/escopo-api/projeto'
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

function pegarCampoDocumento(
  documento: documentoService.DetalhesDocumento | null,
  campos: (keyof documentoService.DetalhesDocumento)[],
  fallback?: string | number,
) {
  for (const campo of campos) {
    const valor = documento?.[campo]

    if (valor !== undefined && valor !== null && valor !== '') {
      return valor
    }
  }

  return fallback
}

function podeAlterar(nivelAcessoId: number | null, projetoIdentificado: boolean) {
  return !projetoIdentificado || nivelAcessoId === 1 || nivelAcessoId === 2
}

export default function Documento() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { showAlert } = useAlert()

  const documentoId = useMemo(() => {
    const id = params.id

    return Array.isArray(id) ? id[0] : id
  }, [params.id])
  const projetoIdParam = useMemo(() => {
    const id = params.projetoId || params.projeto_id

    return Array.isArray(id) ? id[0] : id
  }, [params.projetoId, params.projeto_id])

  const [documento, setDocumento] = useState<documentoService.DetalhesDocumento | null>(null)
  const [versoes, setVersoes] = useState<documentoService.VersaoMin[]>([])

  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [nivelAcessoId, setNivelAcessoId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [editingTitle, setEditingTitle] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const projetoId = useMemo(
    () => pegarCampoDocumento(documento, ['projeto_id', 'projetoId'], projetoIdParam),
    [documento, projetoIdParam],
  )
  const podeAlterarDocumento = podeAlterar(nivelAcessoId, Boolean(projetoId))

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

  useEffect(() => {
    let ativo = true

    async function carregarNivelAcesso() {
      if (!projetoId) {
        setNivelAcessoId(null)
        return
      }

      try {
        const projeto = await projetoService.obterDetalhesDoProjetoPorId(projetoId)
        const nivel = Number(projeto?.nivel_acesso_id)

        if (ativo) {
          setNivelAcessoId(Number.isFinite(nivel) ? nivel : null)
        }
      } catch {
        if (ativo) {
          setNivelAcessoId(null)
        }
      }
    }

    carregarNivelAcesso()

    return () => {
      ativo = false
    }
  }, [projetoId])

  useEffect(() => {
    if (podeAlterarDocumento) return

    setEditingTitle(false)
    setEditingContent(false)
  }, [podeAlterarDocumento])

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

    if (!podeAlterarDocumento) {
      showAlert('Seu nível de acesso não permite alterar este documento.', 'error')
      return
    }

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

  const createdAt =
    versoes.length > 0
      ? [...versoes].sort(
          (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime(),
        )[0]?.criado_em
      : undefined
  const updatedAt =
    documento.ultima_alteracao ||
    (versoes.length > 0
      ? [...versoes].sort(
          (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
        )[0]?.criado_em
      : undefined)
  const hasChanges = titulo.trim() !== documento.titulo || conteudo !== (documento.conteudo || '')

  if (commentsOpen) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Comentarios
          documentoId={documentoId}
          projetoId={projetoId}
          onVoltar={() => setCommentsOpen(false)}
          onErro={(mensagem) => showAlert(mensagem, 'error')}
        />
      </SafeAreaView>
    )
  }

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

              {editingTitle ? (
                <TextInput
                  value={titulo}
                  onChangeText={setTitulo}
                  onBlur={() => setEditingTitle(false)}
                  editable={podeAlterarDocumento && !saving}
                  autoFocus
                  numberOfLines={1}
                  className="min-w-0 flex-1 rounded border border-cinza-600 px-2 py-0 font-inter-bold text-2xl text-black"
                  selectionColor={PURPLE}
                />
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={!podeAlterarDocumento || saving}
                  onPress={() => setEditingTitle(true)}
                  className="min-w-0 flex-1"
                >
                  <Text className="font-inter-bold text-2xl text-black" numberOfLines={1}>
                    {titulo}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text className={`text-sm ${hasChanges ? 'text-alert' : 'text-variant'}`}>
              {hasChanges ? 'Alterações não salvas!' : `Última Alteração: ${formatDate(updatedAt)}`}
            </Text>
            <Text className="text-sm text-black">
              Data de criação: {formatDate(documento.criado_em || createdAt)}
            </Text>

            <View className="absolute bottom-2 right-3 flex-row items-center gap-7">
              <TouchableOpacity
                onPress={abrirHistorico}
                className="h-10 w-10 items-center justify-center"
              >
                <History size={40} color={LIGHT_PURPLE} strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCommentsOpen(true)}
                className="h-10 w-10 items-center justify-center rounded-lg bg-base"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <MessagesSquare size={24} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          <View className="relative z-0 mt-3 flex-1 rounded-2xl border border-cinza-300 bg-white px-4 py-4">
            {editingContent ? (
              <TextInput
                value={conteudo}
                onChangeText={setConteudo}
                multiline
                textAlignVertical="top"
                editable={podeAlterarDocumento}
                onBlur={() => setEditingContent(false)}
                selectionColor={PURPLE}
                placeholder="Este documento ainda não possui conteúdo."
                placeholderTextColor="#6B7280"
                className="flex-1 p-0 font-inter text-base leading-6 text-black"
              />
            ) : (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  if (podeAlterarDocumento) setEditingContent(true)
                }}
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

            {podeAlterarDocumento && hasChanges && (
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
