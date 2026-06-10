import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronsLeft, EllipsisVertical, PencilLine, Trash2 } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Image, ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import USER_DEFAULT_IMAGE from '@/assets/images/icons/user-default.jpg'
import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import * as reuniaoService from '@/services/escopo-api/reuniao'
// import * as linkReuniaoService from '@/services/escopo-api/link-reuniao'
// import * as convidadoReuniaoService from '@/services/escopo-api/convidado-reuniao'
// import * as usuarioReuniaoService from "@/services/escopo-api/usuario-reuniao";
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

export default function DetailsMeeting() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { showAlert } = useAlert()

  const [detalhesReuniao, setDetalhesReuniao] = useState<reuniaoService.DetalhesReuniao>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarReuniao() {
      try {
        const data = await reuniaoService.obterDetalhesDeUmaReuniao(String(id))
        setDetalhesReuniao(data)
      } catch (err) {
        showAlert(extractApiErrorMessage(err), 'error')
      } finally {
        setLoading(false)
      }
    }

    carregarReuniao()
  }, [id])

  function gerarIniciais(nomeCompleto: string) {
    if (!nomeCompleto) return ''

    return nomeCompleto
      .split(' ')
      .map((parte) => parte[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const formatarData = (dataString: string | undefined) => {
    if (!dataString) return ''
    return new Date(dataString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return <Loading />
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-cinza-300 px-4 pb-3">
        <View className="flex-1 flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/projeto/${detalhesReuniao?.projeto_id}`)}
          >
            <ChevronsLeft className="text-cinza-800 h-9 w-9" />
          </TouchableOpacity>

          <View className="flex-1 flex-col">
            <Text numberOfLines={1} className="text-cinza-800 font-inter-bold text-xl">
              {detalhesReuniao?.titulo || 'Reunião'}
            </Text>
            <Text className="font-inter-regular text-xs text-cinza-500">
              Realizado em: {formatarData(detalhesReuniao?.criado_em)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          className="h-10 w-10 items-center justify-center rounded-xl bg-base"
          onPress={() => {
            /* Lógica de deletar */
          }}
        >
          <Trash2 size={20} color={'white'} />
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO SCROLLÁVEL */}
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* CARD: GRAVAÇÃO DA REUNIÃO */}
        <View className="mt-4 w-full flex-col gap-3 rounded-2xl border border-cinza-300 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-inter-semibold text-base text-cinza-600">
              Gravação da Reunião
            </Text>
            <TouchableOpacity className="p-1">
              <PencilLine size={16} className="text-cinza-800" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-3">
            {detalhesReuniao?.links
              ?.filter((link: any) => link.tipo_link === 'reuniao')
              .map((link: any) => (
                <TouchableOpacity
                  key={link.id}
                  activeOpacity={0.7}
                  onPress={() => router.push(link.url)}
                  className="rounded-xl bg-purple-600 px-4 py-2.5"
                >
                  <Text className="font-inter-medium text-sm text-white">Acessar Gravação</Text>
                </TouchableOpacity>
              ))}

            <TouchableOpacity activeOpacity={0.7} className="py-2">
              <Text className="font-inter-medium text-sm text-purple-600 underline">
                Transcrição
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD: LINKS ADICIONAIS */}
        <View className="mt-4 w-full flex-col rounded-2xl border border-cinza-300 p-4">
          <Text className="mb-2 font-inter-semibold text-sm text-cinza-600">Links Adicionais</Text>

          {detalhesReuniao?.links
            ?.filter((link: any) => link.tipo_link === 'link_adicional')
            .map((link: any) => (
              <View key={link.id} className="flex-row items-center justify-between py-1.5">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push(link.url)}
                  className="flex-1"
                >
                  <Text
                    numberOfLines={1}
                    className="font-inter-regular text-sm text-purple-600 underline"
                  >
                    {link.nome}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity className="p-1">
                  <Trash2 size={16} className="text-red-500" />
                </TouchableOpacity>
              </View>
            ))}

          <TouchableOpacity
            activeOpacity={0.7}
            className="mt-3 w-full items-center justify-center rounded-xl border border-dashed border-purple-400 py-2.5"
          >
            <Text className="font-inter-medium text-sm text-purple-600">+ Adicionar link</Text>
          </TouchableOpacity>
        </View>

        {/* CARD: PARTICIPANTES */}
        <View className="mt-4 w-full flex-col rounded-2xl border border-cinza-300 p-4">
          <Text className="mb-2 font-inter-semibold text-sm text-cinza-600">Participantes</Text>

          {detalhesReuniao?.usuarios?.map((usuario: any, index: number) => (
            <View
              key={`${usuario.id}-${index}`}
              className="flex-row items-center justify-between border-b border-cinza-100 py-3"
            >
              <View className="flex-row items-center gap-3">
                <Image
                  source={usuario.foto_perfil ? { uri: usuario.foto_perfil } : USER_DEFAULT_IMAGE}
                  className="h-10 w-10 rounded-full bg-cinza-200"
                />
                <Text className="text-cinza-800 font-inter-medium text-sm">{usuario.nome}</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Text className="font-inter-regular text-xs text-cinza-500">{usuario.cargo}</Text>
                <TouchableOpacity className="p-1">
                  <EllipsisVertical size={18} className="text-cinza-600" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-cinza-50 mt-3 w-full items-center justify-center rounded-xl border border-cinza-200 py-2.5"
          >
            <Text className="font-inter-medium text-sm text-cinza-700">Novo Participante</Text>
          </TouchableOpacity>
        </View>

        {/* CARD: CONVIDADOS */}
        <View className="mt-4 w-full flex-col rounded-2xl border border-cinza-300 p-4">
          <Text className="mb-2 font-inter-semibold text-sm text-cinza-600">Convidados</Text>

          {detalhesReuniao?.convidados?.map((convidado: any) => (
            <View
              key={convidado.id}
              className="flex-row items-center justify-between border-b border-cinza-100 py-3"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-cinza-200">
                  <Text className="font-inter-semibold text-xs text-cinza-600">
                    {gerarIniciais(convidado.nome)}
                  </Text>
                </View>
                <Text className="text-cinza-800 font-inter-medium text-sm">{convidado.nome}</Text>
              </View>

              <Text className="font-inter-regular text-xs text-cinza-500">{convidado.cargo}</Text>
            </View>
          ))}

          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-cinza-50 mt-3 w-full items-center justify-center rounded-xl border border-cinza-200 py-2.5"
          >
            <Text className="font-inter-medium text-sm text-cinza-700">Novo Convidado</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
