import { useRouter } from 'expo-router'
import { ArrowLeft, FileQuestion } from 'lucide-react-native'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Text } from '@/components/ui/Text'

export default function NotFoundScreen() {
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-cinza-100">
          <FileQuestion size={48} className="text-cinza-500" />
        </View>

        <Text className="text-cinza-800 mb-2 text-center font-inter-bold text-2xl">
          Ops! Nada por aqui.
        </Text>

        <Text className="font-inter-regular mb-8 text-center text-base text-cinza-500">
          O recurso que você está procurando não foi encontrado, foi removido ou está
          temporariamente indisponível.
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-base px-6 py-3.5"
        >
          <ArrowLeft size={20} color="white" />
          <Text className="font-inter-semibold text-base text-white">
            Voltar para onde eu estava
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
