import { useRouter } from 'expo-router'
import { List, ListCheck } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import * as notificacaoService from '@/services/escopo-api/notificacao'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

interface NotificacaoProps {
  notificacao: notificacaoService.Notificacao
  onOpen: (notificacao: notificacaoService.Notificacao) => void
}

const NotificacaoItem = React.memo(({ notificacao, onOpen }: NotificacaoProps) => {
  const descricao = notificacao?.descricao || ''

  const isLida = Number(notificacao.aberto) === 1

  const Icone = isLida ? ListCheck : List
  const iconeCor = isLida ? '#10B981' : '#9CA3AF'
  const tituloCor = isLida ? 'text-cinza-800' : 'text-cinza-500'

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onOpen(notificacao)}
      className="mb-3 w-full flex-row items-center gap-3 rounded-xl border border-cinza-200 bg-white p-3.5 shadow-sm"
    >
      <View>
        <Icone size={24} color={iconeCor} strokeWidth={2.5} />
      </View>

      <View className="flex-1 flex-col">
        <View className="flex-row items-start justify-between gap-2">
          <Text numberOfLines={1} className={`flex-1 font-inter-semibold text-base ${tituloCor}`}>
            {notificacao.documento_titulo}
          </Text>

          <View className="rounded-md bg-purple-50 px-2 py-1">
            <Text
              numberOfLines={1}
              className="max-w-[100px] font-inter-medium text-xs text-purple-700"
            >
              {notificacao.projeto_titulo}
            </Text>
          </View>
        </View>

        <Text className="font-inter-regular mt-1 text-sm text-cinza-600">{descricao}</Text>
      </View>
    </TouchableOpacity>
  )
})

export default function Notificacoes() {
  const router = useRouter()
  const { showAlert } = useAlert()
  const insets = useSafeAreaInsets()
  const scrollViewPadding = {
    paddingTop: 20,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }

  const [notificacoes, setNotificacoes] = useState<notificacaoService.Notificacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarNotificacoes() {
      try {
        setLoading(true)
        const data = await notificacaoService.obterNotificacoes()
        setNotificacoes(data)
      } catch (err) {
        showAlert(extractApiErrorMessage(err), 'error')
      } finally {
        setLoading(false)
      }
    }

    carregarNotificacoes()
  }, [])

  const notificacoesOrdenadas = useMemo(() => {
    return [...notificacoes].sort((a, b) => {
      const dataA = a.data || ''
      const dataB = b.data || ''
      return dataB.localeCompare(dataA)
    })
  }, [notificacoes])

  const gruposMobile = useMemo(() => {
    const gruposMap = new Map<string, notificacaoService.Notificacao[]>()

    notificacoesOrdenadas.forEach((notificacao) => {
      const dataFormatada = new Date(notificacao.data).toLocaleDateString('pt-BR')
      if (!gruposMap.has(dataFormatada)) {
        gruposMap.set(dataFormatada, [])
      }
      gruposMap.get(dataFormatada)!.push(notificacao)
    })

    return Array.from(gruposMap.entries()).map(([date, notifications]) => ({
      date,
      notifications,
    }))
  }, [notificacoesOrdenadas])

  const handleOpenNotificacao = useCallback(
    async (notificacao: notificacaoService.Notificacao) => {
      if (!notificacao?.id) return

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
    },
    [router, showAlert],
  )

  function renderConteudo() {
    if (notificacoesOrdenadas.length === 0) {
      return (
        <Text className="mt-4 text-center text-base text-cinza-500">
          Nenhuma notificação encontrada.
        </Text>
      )
    }

    return (
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
    )
  }

  if (loading) {
    return <Loading />
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-5" contentContainerStyle={scrollViewPadding}>
        <View className="pb-4">
          <Text className="font-inter-bold text-2xl text-cinza-700">Notificações</Text>
        </View>
        {renderConteudo()}
      </ScrollView>
    </View>
  )
}
