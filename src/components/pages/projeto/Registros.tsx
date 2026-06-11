import { useRouter } from 'expo-router'
import { ChevronDown, ChevronRight } from 'lucide-react-native'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { GroupedData } from '@/schemas/projeto.schema'
import * as registroService from '@/services/escopo-api/registro'

interface RegistrosProps {
  formatRegistros: GroupedData<registroService.Registro>
  projetoId?: string | number
  expandRegister: Record<string, boolean>
  setExpandRegister: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
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

export default function Registros({
  formatRegistros,
  projetoId,
  expandRegister,
  setExpandRegister,
}: RegistrosProps) {
  const router = useRouter()
  // Verifica se o objeto formatRegistros existe e tem pelo menos um ano (chave)
  const hasRegistros = formatRegistros && Object.keys(formatRegistros).length > 0

  return (
    <View className="gap-6">
      {!hasRegistros ? (
        <View className="bg-cinza-50 w-full items-center justify-center rounded-2xl border border-dashed border-cinza-300 py-8">
          <Text className="text-center font-inter-medium text-cinza-500">
            Não há registros neste projeto.
          </Text>
        </View>
      ) : (
        Object.entries(formatRegistros)
          .sort(([anoA], [anoB]) => Number(anoB) - Number(anoA)) // Anos mais recentes primeiro
          .map(([ano, meses]) => (
            <View key={ano}>
              <Text className="mb-4 text-center font-inter-bold text-xl text-cinza-700">{ano}</Text>

              {Object.entries(meses)
                .sort(([mesA], [mesB]) => ORDEM_MESES.indexOf(mesB) - ORDEM_MESES.indexOf(mesA)) // Meses mais recentes primeiro
                .map(([mes, registros]) => (
                  <View key={mes} className="mb-4">
                    <TouchableOpacity
                      onPress={() => setExpandRegister((prev) => ({ ...prev, [mes]: !prev[mes] }))}
                      className="mb-3 flex-row items-center border-b border-cinza-300 pb-2"
                    >
                      <Text className="flex-1 font-inter-bold text-lg text-purple-700">{mes}</Text>
                      {expandRegister[mes] === false ? (
                        <ChevronRight size={20} color="#7E22CE" />
                      ) : (
                        <ChevronDown size={20} color="#7E22CE" />
                      )}
                    </TouchableOpacity>

                    {expandRegister[mes] !== false &&
                      registros.map((reg) => (
                        <TouchableOpacity
                          key={reg.id}
                          onPress={() =>
                            router.push({
                              pathname: '/registro/[id]',
                              params: {
                                id: String(reg.id),
                                ...(projetoId ? { projetoId: String(projetoId) } : {}),
                              },
                            } as any)
                          }
                          className="mb-3 rounded-2xl border border-cinza-300 bg-white p-4"
                        >
                          <View className="flex-row items-start justify-between">
                            <Text
                              className="mr-2 flex-1 font-inter-bold text-base text-cinza-700"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {reg.titulo}
                            </Text>
                            <Text className="text-xs text-cinza-400">
                              {new Date(reg.criado_em).toLocaleDateString('pt-BR')}
                            </Text>
                          </View>
                          <Text className="mt-2 text-sm text-cinza-500" numberOfLines={2}>
                            {reg.conteudo || 'Sem conteúdo.'}
                          </Text>
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
