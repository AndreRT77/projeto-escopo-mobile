import { useRouter } from 'expo-router'
import { ListCheck } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Modal, ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import * as notificacaoService from '@/services/escopo-api/notificacao'
import * as documentoService from '@/services/escopo-api/documento'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

const FILTRO_TODOS = 'todos'

function normalizarResposta(data: any) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.notificacoes)) return data.notificacoes
  return []
}

function obterDataChave(data: any) {
  if (!data) return 'sem-data'
  return String(data).split(/[ T]/)[0] || 'sem-data'
}

function formatarData(data: any) {
  const dataChave = obterDataChave(data)
  if (dataChave === 'sem-data') return 'Sem data'

  const [ano, mes, dia] = dataChave.split('-')
  if (!ano || !mes || !dia) return dataChave

  return `${dia}/${mes}/${ano}`
}

function obterDataTempo(data: any) {
  if (!data) return 0
  const dataNormalizada = String(data).replace(' ', 'T')
  const tempo = new Date(dataNormalizada).getTime()
  return Number.isNaN(tempo) ? 0 : tempo
}

function primeiroValor(objeto: any, campos: string[], fallback = '') {
  for (const campo of campos) {
    if (objeto?.[campo] !== undefined && objeto?.[campo] !== null && objeto?.[campo] !== '') {
      return objeto[campo]
    }
  }
  return fallback
}

function obterProjetoNotificacao(notificacao: any) {
  return primeiroValor(notificacao, ['projeto', 'nome_projeto', 'projeto_nome', 'project'])
}

function extrairTitulo(descricao: string) {
  const [, titulo] = String(descricao || '').match(/"([^"]+)"/) || []
  return titulo || 'Notificação'
}

async function enriquecerComDocumentos(notificacoes: any[]) {
  const documentosIds = [...new Set(notificacoes.map((n) => n.documento_id).filter(Boolean))]

  if (documentosIds.length === 0) return notificacoes

  const documentos = await Promise.all(
    documentosIds.map(async (documentoId) => {
      try {
        const documento = await documentoService.obterDetalhesDeUmDocumento(documentoId)
        return [documentoId, documento]
      } catch (err) {
        return [documentoId, null]
      }
    }),
  )

  const documentoPorId = new Map(documentos as any)

  return notificacoes.map((notificacao) => {
    const documento = documentoPorId.get(notificacao.documento_id)

    return {
      ...notificacao,
      documentoExiste: notificacao.documento_id ? Boolean(documento) : true,
      titulo: primeiroValor(documento, ['titulo', 'documento'], notificacao.titulo),
      projeto: primeiroValor(
        documento,
        ['projeto', 'nome_projeto', 'projeto_nome'],
        obterProjetoNotificacao(notificacao),
      ),
    }
  })
}

interface NotificacaoProps {
  notificacao: any
  onOpen?: (notificacao: any) => void
}

function NotificacaoItem({ notificacao, onOpen }: NotificacaoProps) {
  const descricao = notificacao?.descricao || notificacao?.description || ''
  const titulo = notificacao?.titulo || notificacao?.title || extrairTitulo(descricao)

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onOpen?.(notificacao)}
      className="mb-3 w-full rounded-xl border border-cinza-200 bg-white p-3.5 shadow-sm"
    >
      <View className="flex-row items-center gap-2">
        <ListCheck size={24} color="#10B981" strokeWidth={2.5} />
        <Text numberOfLines={1} className="text-cinza-800 flex-1 font-inter-semibold text-base">
          {titulo}
        </Text>
      </View>
      <Text className="font-inter-regular mt-1 pl-8 text-sm text-cinza-600">{descricao}</Text>
    </TouchableOpacity>
  )
}

export default function Notificacoes() {
  const router = useRouter()
  const { showAlert } = useAlert()
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAtivo, setFiltroAtivo] = useState(FILTRO_TODOS)
  const [notificacaoSemDocumento, setNotificacaoSemDocumento] = useState<any>(null)

  useEffect(() => {
    let ativo = true

    async function carregarNotificacoes() {
      try {
        setLoading(true)

        const data = await notificacaoService.obterNotificacoes()
        const notificacoesNormalizadas = normalizarResposta(data)
        const notificacoesEnriquecidas = await enriquecerComDocumentos(notificacoesNormalizadas)

        if (ativo) {
          setNotificacoes(notificacoesEnriquecidas)
        }
      } catch (err) {
        if (ativo) {
          showAlert(
            extractApiErrorMessage(err) || 'Não foi possível carregar as notificações.',
            'error',
          )
        }
      } finally {
        if (ativo) {
          setLoading(false)
        }
      }
    }

    carregarNotificacoes()

    return () => {
      ativo = false
    }
  }, [])

  const notificacoesOrdenadas = useMemo(
    () => [...notificacoes].sort((a, b) => obterDataTempo(b.data) - obterDataTempo(a.data)),
    [notificacoes],
  )

  const filtros = useMemo(() => {
    const projetos = [...new Set(notificacoes.map((n) => obterProjetoNotificacao(n)))].filter(
      Boolean,
    )

    return [
      { id: FILTRO_TODOS, label: 'Todos' },
      ...projetos.map((projeto) => ({ id: projeto as string, label: projeto as string })),
    ]
  }, [notificacoes])

  useEffect(() => {
    if (!filtros.some((filtro) => filtro.id === filtroAtivo)) {
      setFiltroAtivo(FILTRO_TODOS)
    }
  }, [filtroAtivo, filtros])

  const notificacoesFiltradas = useMemo(() => {
    if (filtroAtivo === FILTRO_TODOS) {
      return notificacoesOrdenadas
    }
    return notificacoesOrdenadas.filter((n) => obterProjetoNotificacao(n) === filtroAtivo)
  }, [filtroAtivo, notificacoesOrdenadas])

  const gruposMobile = useMemo(() => {
    const grupos: { date: string; notifications: any[] }[] = []
    const indicePorData = new Map()

    notificacoesFiltradas.forEach((notificacao) => {
      const dataChave = obterDataChave(notificacao.data)

      if (!indicePorData.has(dataChave)) {
        indicePorData.set(dataChave, grupos.length)
        grupos.push({
          date: formatarData(notificacao.data),
          notifications: [],
        })
      }

      grupos[indicePorData.get(dataChave)].notifications.push(notificacao)
    })

    return grupos
  }, [notificacoesFiltradas])

  async function handleOpenNotificacao(notificacao: any) {
    if (!notificacao?.id) return

    if (notificacao.documento_id) {
      try {
        await documentoService.obterDetalhesDeUmDocumento(notificacao.documento_id)
      } catch (err) {
        setNotificacoes((prev) =>
          prev.map((item) =>
            item.id === notificacao.id ? { ...item, documentoExiste: false } : item,
          ),
        )
        setNotificacaoSemDocumento(notificacao)
        return
      }
    }

    try {
      if (Number(notificacao.aberto) !== 1) {
        await notificacaoService.marcarNotificacaoComoLida(notificacao.id)
        setNotificacoes((prev) =>
          prev.map((item) => (item.id === notificacao.id ? { ...item, aberto: 1 } : item)),
        )
      }
    } catch (err) {
      showAlert(extractApiErrorMessage(err) || 'Erro ao marcar notificação como lida', 'error')
    }

    if (notificacao.documento_id) {
      router.push(`/documento/${notificacao.documento_id}`)
    }
  }

  const mensagem = loading
    ? 'Carregando notificações...'
    : notificacoesOrdenadas.length === 0
      ? 'Nenhuma notificação encontrada.'
      : notificacoesFiltradas.length === 0
        ? 'Nenhuma notificação neste filtro.'
        : ''

  return (
    <SafeAreaView className="bg-cinza-50 flex-1">
      <View className="px-5 pb-4 pt-6">
        <Text className="font-inter-bold text-2xl text-cinza-700">Notificações</Text>

        {/* Filtros Horizontais */}
        <View className="mt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {filtros.map((filtro) => (
              <TouchableOpacity
                key={filtro.id}
                onPress={() => setFiltroAtivo(filtro.id)}
                className={`mr-3 rounded-full px-4 py-2 ${
                  filtroAtivo === filtro.id ? 'bg-purple-100' : 'bg-cinza-200'
                }`}
              >
                <Text
                  className={`font-inter-medium text-sm ${
                    filtroAtivo === filtro.id ? 'text-purple-700' : 'text-cinza-700'
                  }`}
                >
                  {filtro.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#6B7280" className="mt-10" />
        ) : mensagem ? (
          <Text className="mt-4 text-center text-base text-cinza-500">{mensagem}</Text>
        ) : (
          <View className="flex-col gap-6">
            {gruposMobile.map((group, groupIndex) => (
              <View key={`${group.date}-${groupIndex}`} className="flex-col">
                <Text className="mb-3 font-inter-semibold text-cinza-600">{group.date}</Text>

                <View className="flex-col">
                  {group.notifications.map((notification) => (
                    <NotificacaoItem
                      key={notification.id}
                      notificacao={notification}
                      onOpen={handleOpenNotificacao}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Documento Inexistente */}
      <Modal
        visible={!!notificacaoSemDocumento}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificacaoSemDocumento(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-5">
          <View className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-lg">
            <Text className="font-inter-bold text-xl text-cinza-700">Documento não encontrado</Text>
            <Text className="font-inter-regular mt-3 text-base text-cinza-600">
              Este documento não existe mais ou não está mais disponível para você.
            </Text>

            <View className="mt-6 flex-row justify-end">
              <TouchableOpacity
                onPress={() => setNotificacaoSemDocumento(null)}
                className="bg-cinza-800 rounded-lg px-5 py-2.5"
              >
                <Text className="font-inter-semibold text-white">Entendi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
