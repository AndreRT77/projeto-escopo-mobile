import { X } from 'lucide-react-native'
import React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { Select } from '@/components/ui/Select'

export interface Integrante {
  id: string | number
  nome: string
  email: string
  fotoPerfil?: string
  isOwner?: boolean
  nivel_acesso_id: number
  usuario_projeto_id?: string | number
  convite_id?: string | number
}

interface ProjectMemberProps {
  integrante: Integrante
  id: string | number
  isOwner?: boolean
  adicional?: boolean
  pendente?: boolean
  onClose: () => void
  onNivelAcessoChange: (id: string | number, novoNivel: number) => void
}

const NIVEIS_ACESSO = [
  { id: 1, label: 'Gerente' },
  { id: 2, label: 'Analista' },
  { id: 3, label: 'Dev' },
  { id: 4, label: 'Cliente' },
]

export function ProjectMember({
  integrante,
  id,
  isOwner = false,
  adicional = false,
  pendente = false,
  onClose,
  onNivelAcessoChange,
}: ProjectMemberProps) {
  return (
    <View
      className={`mb-2 w-full flex-row items-center justify-between rounded-xl border bg-cinza-100 p-3
        ${isOwner ? 'border-transparent bg-cinza-200' : 'border-transparent'}
        ${pendente ? 'border-transparent opacity-70' : ''}
        ${adicional ? 'border-purple-300 bg-purple-50' : ''}
      `}
    >
      <View className="mr-2 flex-1 flex-row items-center gap-3">
        <Image
          source={{
            uri:
              integrante.fotoPerfil ||
              'https://upload.wikimedia.org/wikipedia/commons/2/2f/No-photo-m.png',
          }}
          className="h-9 w-9 rounded-full bg-cinza-300"
        />
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className={`font-inter-semibold text-sm text-cinza-700
              ${pendente ? 'text-cinza-400' : ''}
              ${adicional ? 'text-purple-900' : ''}
            `}
          >
            {integrante.nome}
          </Text>

          {isOwner && (
            <Text className="font-inter-regular text-xs text-cinza-500">Proprietário(a)</Text>
          )}
          {pendente && (
            <Text className="font-inter-regular text-xs text-cinza-400">(Convite pendente)</Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <View className="w-[110px]">
          <Select
            options={NIVEIS_ACESSO}
            selectedValue={integrante.nivel_acesso_id || 4}
            onValueChange={(value) => onNivelAcessoChange(id, Number(value))}
            disabled={isOwner}
            triggerClassName={`py-1.5 px-2 border border-cinza-300 rounded-lg
              ${isOwner ? 'bg-cinza-100 opacity-50 border-transparent' : 'bg-white'}
              ${adicional ? 'border-purple-300 bg-purple-100' : ''}
            `}
            textClassName="text-xs font-inter-medium"
            iconSize={16}
          />
        </View>

        {!isOwner && (
          <TouchableOpacity onPress={onClose} className="p-1">
            <X size={18} color="#4B5563" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
