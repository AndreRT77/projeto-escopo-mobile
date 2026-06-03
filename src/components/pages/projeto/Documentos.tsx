import { FilePlus, Trash2 } from 'lucide-react-native'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { CategoriasComDocumentos } from '@/services/escopo-api/documento'
import * as projetoService from '@/services/escopo-api/projeto'

interface DocumentosProps {
  documentos: CategoriasComDocumentos | null
  deletarCategoria: (categoriaId: number) => void
  projeto: projetoService.DetalhesDoProjeto | null
  onCriarDocumento: (categoriaId: number) => Promise<void>
}

export default function Documentos({
  documentos,
  deletarCategoria,
  projeto,
  onCriarDocumento,
}: DocumentosProps) {
  const categorias = documentos?.projeto?.categorias || []

  return (
    <View className="w-full gap-6">
      {categorias.length === 0 ? (
        <View className="bg-cinza-50 w-full items-center justify-center rounded-2xl border border-dashed border-cinza-300 py-8">
          <Text className="text-center font-inter-medium text-cinza-500">
            Não há categorias neste projeto.
          </Text>
        </View>
      ) : (
        categorias.map((doc) => (
          <View key={doc.id} className="w-full">
            <View className="mb-2 flex-row items-center justify-between px-2">
              <Text className="font-inter-bold text-lg text-cinza-600">{doc.nome}</Text>
              {(projeto?.nivel_acesso_id === 1 || projeto?.nivel_acesso_id === 2) && (
                <TouchableOpacity onPress={() => deletarCategoria(doc.id)}>
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <View className="rounded-2xl border border-cinza-300 bg-white p-4">
              {doc.documentos.map((subdoc) => (
                <TouchableOpacity
                  key={subdoc.id}
                  className="flex-row items-center justify-between border-b border-cinza-100 py-3 last:border-0"
                >
                  <View className="flex-1 pr-4">
                    <Text className="font-inter-bold text-base text-cinza-700" numberOfLines={1}>
                      {subdoc.titulo}
                    </Text>
                    <Text className="text-xs text-cinza-400">
                      Alterado em: {new Date(subdoc.ultima_alteracao).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>

                  <View className="h-6 w-6 items-center justify-center rounded bg-cinza-400">
                    <Text className="font-inter-bold text-[10px] text-white">
                      {subdoc.quantidade_versoes}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Opção para exibir uma mensagem interna caso a categoria não tenha documentos */}
              {doc.documentos.length === 0 && (
                <Text className="py-2 text-center font-inter text-sm text-cinza-400">
                  Nenhum documento criado.
                </Text>
              )}

              {(projeto?.nivel_acesso_id === 1 || projeto?.nivel_acesso_id === 2) && (
                <TouchableOpacity
                  onPress={() => onCriarDocumento(doc.id)}
                  className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-purple-300 py-3"
                >
                  <FilePlus size={18} color="#7E22CE" />
                  <Text className="font-inter-bold text-purple-700">Novo Documento</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  )
}
