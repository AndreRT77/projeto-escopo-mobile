import { useRouter } from 'expo-router'
import { ChevronDown, ChevronRight } from 'lucide-react-native'
import React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { GroupedData } from '@/schemas/projeto.schema'
import * as reuniaoService from '@/services/escopo-api/reuniao'

interface ReunioesProps {
  formatReunioes: GroupedData<reuniaoService.Reuniao>
  expandReuniao: Record<string, boolean>
  setExpandReuniao: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

const ORDEM_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export default function Reunioes({
  formatReunioes,
  expandReuniao,
  setExpandReuniao,
}: ReunioesProps) {
  const router = useRouter()

  // Verifica se o objeto formatReunioes existe e tem pelo menos um ano (chave)
  const hasReunioes = formatReunioes && Object.keys(formatReunioes).length > 0

  return (
    <View className="gap-6">
      {!hasReunioes ? (
        <View className="bg-cinza-50 w-full items-center justify-center rounded-2xl border border-dashed border-cinza-300 py-8">
          <Text className="text-center font-inter-medium text-cinza-500">
            Não há reuniões neste projeto.
          </Text>
        </View>
      ) : (
        Object.entries(formatReunioes)
          .sort(([anoA], [anoB]) => Number(anoB) - Number(anoA)) // Anos mais recentes primeiro
          .map(([ano, meses]) => (
            <View key={ano}>
              <Text className="mb-4 text-center font-inter-bold text-xl text-cinza-700">{ano}</Text>

              {Object.entries(meses)
                .sort(([mesA], [mesB]) => ORDEM_MESES.indexOf(mesB) - ORDEM_MESES.indexOf(mesA)) // Meses mais recentes primeiro
                .map(([mes, reunioes]) => (
                  <View key={mes} className="mb-4">
                    <TouchableOpacity
                      onPress={() => setExpandReuniao((prev) => ({ ...prev, [mes]: !prev[mes] }))}
                      className="mb-3 flex-row items-center border-b border-cinza-300 pb-2"
                    >
                      <Text className="flex-1 font-inter-bold text-lg text-purple-700">{mes}</Text>
                      {expandReuniao[mes] === false ? (
                        <ChevronRight size={20} color="#7E22CE" />
                      ) : (
                        <ChevronDown size={20} color="#7E22CE" />
                      )}
                    </TouchableOpacity>

                    {expandReuniao[mes] !== false &&
                      reunioes.map((reuniao) => (
                        <TouchableOpacity
                          key={reuniao.id}
                          onPress={() => router.push(`/reuniao/${reuniao.id}` as any)}
                          className="mb-3 flex-row items-center justify-between rounded-2xl border border-cinza-300 bg-white p-4"
                        >
                          <View className="mr-2 flex-1">
                            <Text
                              className="font-inter-bold text-base text-cinza-700"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {reuniao.titulo}
                            </Text>
                            <Text className="text-xs text-cinza-500">
                              {new Date(reuniao.criado_em).toLocaleDateString('pt-BR')}
                            </Text>
                          </View>

                          <View className="flex-row-reverse">
                            {reuniao.foto_usuarios?.slice(0, 4).map((foto, idx) => (
                              <View
                                key={idx}
                                className="-mr-3 h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-cinza-200"
                              >
                                <Image
                                  source={
                                    foto
                                      ? { uri: foto }
                                      : require('@/assets/images/icons/user-default.jpg')
                                  }
                                  className="h-full w-full"
                                />
                              </View>
                            ))}
                          </View>
                        </TouchableOpacity>
                      ))}
                  </View>
                ))}
            </View>
          ))
      )}
    </View>
  )
}
