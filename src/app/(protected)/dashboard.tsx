import { Link } from 'expo-router'
import { Check, ChevronRight, Folder, FolderOpen, MailOpen, X } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import * as dashboardService from '@/services/escopo-api/dashboard'
import { formatDate } from '@/utils/formatters'

interface Documento {
  id: string | number
  projeto: string
  categoria: string
  documento: string
}

interface Convite {
  id: string | number
  criado_em: string
  status: { id: number }
  nome_remetente: string
  projeto: string
}

interface DocumentQuickAccessProps {
  documento: Documento
}

function DocumentQuickAccess({ documento }: DocumentQuickAccessProps) {
  if (!documento) return null

  return (
    <Link href={`/documento/${documento.id}`} asChild>
      <TouchableOpacity className="mr-3 w-[196px] overflow-hidden rounded-xl border-2 border-cinza-300 bg-white p-4 shadow-sm">
        <View className="mb-3 flex-row items-center gap-3">
          <Folder size={24} color="#6B7280" />
          <ChevronRight size={20} color="#374151" className="ml-auto" />
        </View>
        <View>
          <Text className="font-inter-bold text-lg text-cinza-700" numberOfLines={1}>
            {documento.projeto || 'Sem título'}
          </Text>
          <Text className="mt-1 text-base text-cinza-500">{documento.categoria || 'Geral'}:</Text>
          <Text className="text-base text-cinza-500" numberOfLines={1}>
            {documento.documento || 'Sem conteúdo'}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  )
}

interface InviteProps {
  convite: Convite
  onAnswerInvite: (conviteId: string | number, statusId: number) => void
}

function Invite({ convite, onAnswerInvite }: InviteProps) {
  if (!convite) return null

  // Proteção contra criado_em undefined
  const data = convite.criado_em ? convite.criado_em.split('T')[0] : ''

  const message =
    convite.status?.id === 1
      ? `${convite.nome_remetente || 'Alguém'} te enviou um convite para participar do(a) ${convite.projeto || 'projeto'}.`
      : `${convite.nome_remetente || 'Alguém'} aceitou seu convite para participar do(a) ${convite.projeto || 'projeto'}.`

  return (
    <View className="mb-3 flex-row items-center justify-between gap-4 rounded-xl border-2 border-cinza-300 bg-white p-4">
      <View className="flex-1">
        <Text className="text-base text-cinza-700">{message}</Text>
        {data ? <Text className="mt-1 text-sm text-cinza-500">{formatDate(data)}</Text> : null}
      </View>

      {/* Interação com o convite */}
      {convite.status?.id === 1 ? (
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => onAnswerInvite(convite.id, 6)}
            className="flex items-center justify-center rounded-full border border-green-500 p-2"
          >
            <Check size={20} color="#22C55E" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onAnswerInvite(convite.id, 2)}
            className="flex items-center justify-center rounded-full border border-red-500 p-2"
          >
            <X size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : convite.status?.id === 4 ? (
        <TouchableOpacity
          onPress={() => onAnswerInvite(convite.id, 5)}
          className="flex items-center justify-center rounded-full border border-green-500 p-2"
        >
          <Check size={20} color="#22C55E" />
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export default function Dashboard() {
  const { showAlert } = useAlert()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [convites, setConvites] = useState<Convite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await dashboardService.getDashboard()
        // Garantia de fallback caso a API retorne algo nulo
        setDocumentos(data?.documentos || [])
        setConvites(data?.convites || [])
      } catch (error) {
        console.error(error)
        showAlert('Erro ao carregar o dashboard', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  // Agrupamento seguro de convites por data
  const convitesOrdenados = (convites || []).reduce(
    (acc, convite) => {
      if (!convite || !convite.criado_em) return acc

      const dia = convite.criado_em.split('T')[0]
      if (!acc[dia]) {
        acc[dia] = []
      }
      acc[dia].push(convite)
      return acc
    },
    {} as Record<string, Convite[]>,
  )

  async function handleAnswerInvite(conviteId: string | number, statusId: number) {
    try {
      await dashboardService.answerInvite(conviteId, statusId)
      setConvites((prev) => prev.filter((convite) => convite.id !== conviteId))
      showAlert('Convite atualizado com sucesso', 'success')
    } catch (error) {
      showAlert('Erro ao atualizar convite', 'error')
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#7E22CE" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-5 py-6"
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Sessão: Acesso Rápido */}
        <View className="mb-8">
          <Text className="mb-4 font-inter-bold text-2xl text-cinza-700">
            Continue de onde parou
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
            {documentos && documentos.length > 0 ? (
              documentos.map((documento) => (
                <DocumentQuickAccess key={documento?.id} documento={documento} />
              ))
            ) : (
              <View className="mr-3 w-72 flex-row items-center justify-between gap-4 rounded-xl border-2 border-cinza-300 bg-white p-4">
                <View className="flex-1">
                  <Text className="font-inter-bold text-lg text-cinza-700">
                    Sem atividade recente
                  </Text>
                  <Text className="mt-1 text-sm text-cinza-500">
                    As últimas atividades realizadas em documentos aparecerão aqui.
                  </Text>
                </View>
                <FolderOpen size={32} color="#9CA3AF" />
              </View>
            )}
          </ScrollView>
        </View>

        {/* Sessão: Convites */}
        <View>
          <Text className="mb-4 font-inter-bold text-2xl text-cinza-700">Convites</Text>

          <View className="gap-2">
            {convites && convites.length > 0 ? (
              Object.entries(convitesOrdenados).map(([data, convitesDia]) => (
                <View key={data} className="mb-4 flex-col gap-2">
                  <Text className="mb-1 font-inter-bold text-base text-cinza-500">
                    {formatDate(data)}
                  </Text>

                  {convitesDia.map((convite) => (
                    <Invite
                      key={convite?.id}
                      convite={convite}
                      onAnswerInvite={handleAnswerInvite}
                    />
                  ))}
                </View>
              ))
            ) : (
              <View className="rounded-xl border-2 border-cinza-300 bg-white p-6">
                <Text className="font-inter-bold text-lg text-cinza-700">
                  Sem convites no momento
                </Text>
                <Text className="mt-2 text-base text-cinza-500">
                  Quando alguém te convidar para um projeto, o convite irá aparecer aqui.
                </Text>
                <View className="mt-4 items-end">
                  <MailOpen size={32} color="#9CA3AF" />
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
