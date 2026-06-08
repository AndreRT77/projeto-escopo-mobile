import { ChevronsLeft, Check, SendHorizontal } from 'lucide-react-native'
import React, { useMemo, useState } from 'react'
import { Image, ScrollView, TextInput, TouchableOpacity, View } from 'react-native'

import userDefault from '@/assets/images/icons/user-default.jpg'
import { Text } from '@/components/ui/Text'
import type { Comentario } from '@/services/escopo-api/comentario'

interface ComentariosProps {
  comentarios: Comentario[]
  enviando?: boolean
  onCriarComentario: (conteudo: string) => Promise<void>
  onVoltar: () => void
}

const AUTHORS = [
  { name: 'Carlos Ribeiro', role: 'Cliente' },
  { name: 'Marcos Santos', role: 'Desenvolvedor' },
  { name: 'Larissa Lemos', role: 'Analista' },
]

const PURPLE = '#552BA9'

function formatTime(date?: string) {
  if (!date) return '--:--'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return '--:--'
  }

  return parsedDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(date?: string) {
  if (!date) return '---'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return '---'
  }

  return parsedDate.toLocaleDateString('pt-BR')
}

function getAuthor(index: number) {
  return AUTHORS[index % AUTHORS.length]
}

export default function Comentarios({
  comentarios,
  enviando = false,
  onCriarComentario,
  onVoltar,
}: ComentariosProps) {
  const [novoComentario, setNovoComentario] = useState('')

  const comentariosOrdenados = useMemo(
    () =>
      [...comentarios].sort(
        (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime(),
      ),
    [comentarios],
  )

  async function handleEnviarComentario() {
    const conteudo = novoComentario.trim()

    if (!conteudo) return

    await onCriarComentario(conteudo)
    setNovoComentario('')
  }

  return (
    <View className="flex-1 bg-white px-4 pt-3">
      <View className="mb-3 flex-row items-center">
        <TouchableOpacity onPress={onVoltar} className="h-10 w-10 items-center justify-center">
          <ChevronsLeft size={34} color="#374151" strokeWidth={2.5} />
        </TouchableOpacity>

        <Text className="ml-1 font-inter-bold text-2xl text-cinza-700">Comentários</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        showsVerticalScrollIndicator={false}
      >
        {comentariosOrdenados.length === 0 ? (
          <View className="mt-10 items-center px-8">
            <Text className="text-center text-base text-cinza-500">
              Nenhum comentário criado para este documento.
            </Text>
          </View>
        ) : (
          comentariosOrdenados.map((comentario, index) => {
            const author = getAuthor(index)
            const isReply = comentario.parent_id !== null
            const isSuggestion = comentario.registro_referencia !== null

            return (
              <View key={comentario.id} className="mb-5 flex-row items-start">
                <Image
                  source={userDefault}
                  className="h-[52px] w-[52px] rounded-full border border-base"
                />

                <View className="ml-2 flex-1">
                  <View className="mb-1 flex-row items-center">
                    <Text className="font-inter-semibold text-sm" style={{ color: PURPLE }}>
                      {author.name}
                    </Text>
                    <Text className="ml-1 flex-1 text-sm text-cinza-300" numberOfLines={1}>
                      {author.role}
                    </Text>
                    <Text className="text-xs text-cinza-400">
                      {formatTime(comentario.criado_em)} · {formatDate(comentario.criado_em)}
                    </Text>
                  </View>

                  <View className="rounded-xl border border-cinza-500 bg-white px-3 py-2">
                    {isReply && (
                      <View className="mb-2 rounded bg-cinza-200 p-2">
                        <Text className="text-xs" style={{ color: PURPLE }}>
                          Carlos Ribeiro Cliente
                        </Text>
                        <Text className="mt-2 text-xs text-cinza-600" numberOfLines={3}>
                          Os requisitos estão alinhados com as minhas ideias no geral, mas faltam
                          mais detalhes
                        </Text>
                      </View>
                    )}

                    {isSuggestion && (
                      <View className="mb-2 rounded bg-roxo-light px-2 py-1">
                        <Text className="text-xs" style={{ color: PURPLE }}>
                          Sugestão de Requisito Registro 01
                        </Text>
                      </View>
                    )}

                    <Text className="text-sm leading-5 text-black">{comentario.conteudo}</Text>
                  </View>

                  {index === 0 && (
                    <View className="mt-2 flex-row justify-end gap-2">
                      <TouchableOpacity className="rounded border border-cinza-500 px-2 py-1">
                        <Text className="text-sm text-black">Responder</Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="h-8 w-8 items-center justify-center rounded border border-cinza-500">
                        <Check size={18} color="#374151" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-4 right-4 border-t border-cinza-500 bg-white py-3">
        <View className="flex-row items-center">
          <Image
            source={userDefault}
            className="h-[52px] w-[52px] rounded-full border border-base"
          />

          <View className="ml-2 flex-1 flex-row items-center rounded-xl border border-cinza-500 px-3">
            <TextInput
              value={novoComentario}
              onChangeText={setNovoComentario}
              editable={!enviando}
              placeholder="Escreva seu comentário"
              placeholderTextColor="#6B7280"
              className="min-h-9 flex-1 font-inter text-sm text-black"
            />

            <TouchableOpacity
              onPress={handleEnviarComentario}
              disabled={enviando || novoComentario.trim().length === 0}
              className="h-9 w-9 items-center justify-center disabled:opacity-40"
            >
              <SendHorizontal size={25} color="#552BA9" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}
