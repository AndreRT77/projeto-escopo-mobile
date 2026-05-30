import { X } from 'lucide-react-native'
import React, { ReactNode } from 'react'
import { Modal, TouchableOpacity, View } from 'react-native'

import { Text } from '@/components/ui/Text'

interface FormModalProps {
  visible: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function FormModal({ visible, onClose, title, children }: FormModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-4">
        <View className="relative w-full max-w-md rounded-[32px] bg-white p-6 shadow-external">
          <TouchableOpacity onPress={onClose} className="absolute right-4 top-4 z-10">
            <X size={24} color="#374151" />
          </TouchableOpacity>

          <Text className="mb-6 mt-2 text-center font-inter-bold text-2xl text-cinza-700">
            {title}
          </Text>

          {children}
        </View>
      </View>
    </Modal>
  )
}
