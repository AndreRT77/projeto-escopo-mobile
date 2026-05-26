import { Link } from 'expo-router'
import { ChevronRight, Plus } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'

import { Alert } from '@/components/ui/Alert'
import { Text } from '@/components/ui/Text'
import type { Project } from '@/services/escopo-api/projeto'
import * as projetoService from '@/services/escopo-api/projeto'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

export default function Projetos() {
  const [projetos, setProjetos] = useState<Project[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProjects() {
      setError('')

      try {
        const data = await projetoService.getProjects()

        setProjetos(data)
      } catch (err) {
        setError(extractApiErrorMessage(err))
      }
    }

    loadProjects()
  }, [])

  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-6 px-4 py-6" showsVerticalScrollIndicator={false}>
        <Text className="font-inter-bold text-3xl text-cinza-700">Lista de Projetos</Text>

        <Link href="/novo-projeto" asChild>
          <Pressable className="flex-row items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 shadow-external">
            <Plus size={22} className="text-cinza-700" />

            <Text className="font-inter-semibold text-lg text-cinza-700">Novo Projeto</Text>
          </Pressable>
        </Link>

        <View className="flex-row flex-wrap justify-between">
          {projetos.map((projeto) => (
            <View key={projeto.id} className="mb-3 w-[48%]">
              <ProjectCard projeto={projeto} />
            </View>
          ))}
        </View>
      </ScrollView>
      <Alert visible={!!error} message={error} onClose={() => setError('')} />
    </View>
  )
}

type ProjectCardProps = {
  projeto: Project
}

function ProjectCard({ projeto }: ProjectCardProps) {
  return (
    <Link href={`/projeto/${projeto.id}`} asChild>
      <Pressable className="h-[140px] flex-row items-center justify-between rounded-xl bg-white p-3 shadow-external">
        <View className="w-[90%]">
          <Text className="font-inter-semibold text-lg text-cinza-600" numberOfLines={2}>
            {projeto.titulo}
          </Text>

          <Text className="flex-1 text-sm text-cinza-400" numberOfLines={3}>
            {projeto.descricao}
          </Text>

          <View className="flex-row">
            {projeto.foto_usuarios.map((foto, index) =>
              foto ? (
                <Image
                  key={`${foto}-${index}`}
                  source={{ uri: foto }}
                  className="-ml-2 h-8 w-8 rounded-full"
                />
              ) : (
                <View
                  key={index}
                  className="-ml-2 h-8 w-8 rounded-full border border-white bg-cinza-300"
                />
              ),
            )}
          </View>
        </View>
        <ChevronRight size={22} className="text-cinza-400" />
      </Pressable>
    </Link>
  )
}
