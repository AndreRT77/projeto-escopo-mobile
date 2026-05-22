import { Check, CircleX } from 'lucide-react-native'
import { useEffect, useRef } from 'react'
import { Animated, TouchableOpacity, View } from 'react-native'

import { Text } from '@/components/ui/Text'

type AlertProps = {
  visible: boolean
  message?: string
  type?: 'error' | 'success'
  duration?: number
  onClose?: () => void
}

export function Alert({ visible, message, type = 'error', duration = 5000, onClose }: AlertProps) {
  const progress = useRef(new Animated.Value(100)).current

  useEffect(() => {
    if (!visible) {
      progress.setValue(100)
      return
    }

    Animated.timing(progress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start()

    if (!onClose) return

    const timer = setTimeout(onClose, duration)

    return () => clearTimeout(timer)
  }, [visible, duration, onClose])

  if (!visible || !message) {
    return null
  }

  const variants = {
    error: {
      container: 'bg-red-500',
      text: 'text-white',
      icon: CircleX,
    },
    success: {
      container: 'bg-green-600',
      text: 'text-white',
      icon: Check,
    },
  }

  const current = variants[type]

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  })

  return (
    <View
      className={`absolute left-6 right-6 top-12 z-50 overflow-hidden rounded-2xl shadow-lg ${current.container}`}
    >
      <View className="flex-row items-center gap-3 px-4 py-4">
        <current.icon color="white" />
        <Text className={`flex-1 font-inter-medium ${current.text}`}>{message}</Text>

        {!!onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text className={`ml-4 text-lg ${current.text}`}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Barra de tempo */}
      <Animated.View style={{ width }} className="h-1 bg-white/80" />
    </View>
  )
}
