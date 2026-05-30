import { ChevronDown, ChevronUp, PenLine } from 'lucide-react-native'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Text } from '@/components/ui/Text'

interface DescriptionProps {
  project: any
  expand: boolean
  setExpand: (val: boolean) => void
}

export default function DescriptionProject({ project, expand, setExpand }: DescriptionProps) {
  return (
    <View className="w-full p-2">
      <View className="flex-row items-center gap-2">
        <Text className="font-inter-bold text-2xl text-cinza-700">{project?.titulo}</Text>
        {project?.nivel_acesso_id === 1 && (
          <TouchableOpacity>
            <PenLine size={20} color="#7E22CE" />
          </TouchableOpacity>
        )}
      </View>

      <View className="mt-3 gap-2">
        <Text className="text-base text-cinza-600">
          Status:{' '}
          <Text className="font-inter-bold">{project?.status ? 'Concluído' : 'Em andamento'}</Text>
        </Text>

        <View className={expand ? 'gap-2' : 'flex-row items-end justify-between'}>
          <Text numberOfLines={expand ? undefined : 2} className="flex-1 text-base text-cinza-600">
            Descrição: {project?.descricao}
          </Text>

          {expand ? (
            <View className="mt-2 w-full">
              <View className="gap-1 rounded-xl border border-cinza-200 bg-white p-3">
                <Text className="text-sm text-cinza-500">
                  Data de Criação: {new Date(project?.data_criacao).toLocaleDateString()}
                </Text>
                <Text className="text-sm text-cinza-500">
                  Última Alteração: {new Date(project?.ultima_atualizacao).toLocaleDateString()}
                </Text>
                <Text className="text-sm text-cinza-500">
                  Responsável: {project?.nome_responsavel}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setExpand(false)} className="mt-2 self-center">
                <ChevronUp size={24} color="#7E22CE" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setExpand(true)}>
              <ChevronDown size={24} color="#7E22CE" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}
