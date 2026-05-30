import { useRouter } from 'expo-router'
import { ChevronDown, ChevronRight } from 'lucide-react-native'
import React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'

import { Text } from '@/components/ui/Text'

export default function Meeting({ formatReunioes, expandReuniao, setExpandReuniao }: any) {
  const router = useRouter()

  return (
    <View className="gap-6">
      {Object.entries(formatReunioes).map(([ano, meses]: [string, any]) => (
        <View key={ano}>
          <Text className="mb-4 text-center font-inter-bold text-xl text-cinza-700">{ano}</Text>

          {Object.entries(meses).map(([mes, reunioes]: [string, any]) => (
            <View key={mes} className="mb-4">
              <TouchableOpacity
                onPress={() => setExpandReuniao((prev: any) => ({ ...prev, [mes]: !prev[mes] }))}
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
                reunioes.map((reuniao: any) => (
                  <TouchableOpacity
                    key={reuniao.id}
                    onPress={() => router.push(`/reuniao/${reuniao.id}`)}
                    className="mb-3 flex-row items-center justify-between rounded-2xl border border-cinza-300 bg-white p-4"
                  >
                    <View className="mr-2 flex-1">
                      <Text className="font-inter-bold text-base text-cinza-700" numberOfLines={1}>
                        {reuniao.titulo}
                      </Text>
                      <Text className="text-xs text-cinza-500">
                        {new Date(reuniao.criado_em).toLocaleDateString()}
                      </Text>
                    </View>

                    <View className="flex-row-reverse">
                      {reuniao.foto_usuarios?.slice(0, 4).map((foto: string, idx: number) => (
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
      ))}
    </View>
  )
}
