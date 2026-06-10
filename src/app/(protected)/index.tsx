import { Link } from 'expo-router'
import { Check, ChevronRight, Folder, FolderOpen, X } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Image, ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import iconMailOpen from '@/assets/images/icons/icon-mail-open.png'
import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import * as conviteService from '@/services/escopo-api/convite'
import * as dashboardService from '@/services/escopo-api/dashboard'
import { Convite, Documento } from '@/services/escopo-api/dashboard'
import { formatDate } from '@/utils/formatters'

interface InviteProps {
  convite: Convite
  onAnswerInvite: (conviteId: string | number, statusId: number) => void
}

function Invite({ convite, onAnswerInvite }: InviteProps) {
  if (!convite) return null

  const message =
    convite.status?.id === 1
      ? `${convite.nome_remetente || 'Alguém'} te enviou um convite para participar do(a) ${convite.projeto || 'projeto'}.`
      : `${convite.nome_remetente || 'Alguém'} aceitou seu convite para participar do(a) ${convite.projeto || 'projeto'}.`

  return (
    <View className="mb-3 flex-row items-center justify-between gap-4 rounded-xl border-2 border-cinza-300 bg-white p-4">
      <View className="flex-1">
        <Text className="text-base text-cinza-700">{message}</Text>
      </View>

      {/* Interação com o convite */}
      {convite.status?.id === 1 ? (
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => onAnswerInvite(convite.id, 6)} // Aceitar
            className="flex items-center justify-center rounded-xl border border-green-500 p-2"
          >
            <Check size={18} color="#22C55E" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onAnswerInvite(convite.id, 2)} // Rejeitar
            className="flex items-center justify-center rounded-xl border border-red-500 p-2"
          >
            <X size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : convite.status?.id === 4 ? (
        <TouchableOpacity
          onPress={() => onAnswerInvite(convite.id, 5)} // Outro status de aceite
          className="flex items-center justify-center rounded-xl border border-green-500 p-2"
        >
          <Check size={18} color="#22C55E" />
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

        setDocumentos(data?.documentos || [])
        setConvites(data?.convites || [])
      } catch (error) {
        console.error(error)
        showAlert('Erro ao carregar o dashboard.', 'error')
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

  // Função para Atualizar o Status do Convite (Aceitar/Rejeitar)
  async function handleAnswerInvite(conviteId: string | number, statusId: number) {
    try {
      await conviteService.atualizarStatus({
        conviteId: conviteId,
        novoStatusId: statusId,
      })

      // Remove o convite da lista da UI após responder
      setConvites((prev) => prev.filter((convite) => convite.id !== conviteId))
      showAlert('Convite atualizado com sucesso!', 'success')
    } catch (error) {
      console.error(error)
      showAlert('Erro ao atualizar o convite.', 'error')
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1 px-5 py-2"
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
                <Link
                  href={
                    {
                      pathname: '/documento/[id]',
                      params: {
                        id: String(documento?.id),
                        ...(documento?.projeto_id
                          ? { projetoId: String(documento.projeto_id) }
                          : {}),
                      },
                    } as any
                  }
                  key={documento?.id}
                  asChild
                >
                  <TouchableOpacity className="mr-3 w-[196px] overflow-hidden rounded-xl border-2 border-cinza-300 bg-white p-4 shadow-sm">
                    <View className="mb-3 flex-row items-center gap-3">
                      <Folder size={24} color="#6B7280" />
                      <ChevronRight size={20} color="#374151" className="ml-auto" />
                    </View>
                    <View>
                      <Text className="font-inter-bold text-lg text-cinza-700" numberOfLines={1}>
                        {documento.projeto || 'Sem título'}
                      </Text>
                      <Text className="mt-1 text-base text-cinza-500">
                        {documento.categoria || 'Geral'}
                      </Text>
                      <Text className="text-base text-cinza-500" numberOfLines={1}>
                        {documento.documento || 'Sem conteúdo'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
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
                <FolderOpen size={32} color="#9CA3AF" strokeWidth={1.5} />
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
                <Text className="w-full text-center font-inter-bold text-lg text-cinza-700">
                  Sem convites no momento
                </Text>
                <Text className="mt-2 w-full text-center text-base text-cinza-500">
                  Quando alguém te convidar para um projeto, o convite irá aparecer aqui.
                </Text>
                <View className="mt-4 items-center">
                  <Image source={iconMailOpen} />
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
