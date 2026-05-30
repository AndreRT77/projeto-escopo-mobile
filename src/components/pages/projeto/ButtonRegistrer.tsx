import React from 'react'
import { TouchableOpacity } from 'react-native'

import { Text } from '@/components/ui/Text'

interface ButtonRegistrerProps {
  children: React.ReactNode
  onPress?: () => void
  className?: string
}

export default function ButtonRegistrer({
  children,
  onPress,
  className = '',
}: ButtonRegistrerProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`h-10 flex-row items-center justify-center rounded-xl border border-cinza-300 bg-cinza-100 px-4 ${className}`}
    >
      <Text className="text-sm text-cinza-500">{children}</Text>
    </TouchableOpacity>
  )
}
