import { ActivityIndicator, TouchableOpacity, TouchableOpacityProps } from 'react-native'

import { Text } from './Text'

type ButtonProps = TouchableOpacityProps & {
  children: string
  variant?: 'solid' | 'outline'
  loading?: boolean
}

export function Button({
  children,
  variant = 'solid',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isOutline = variant === 'outline'

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={[
        'items-center rounded-lg py-4 disabled:opacity-60',
        isOutline ? 'border-2 border-base' : 'bg-base',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? '#552BA9' : 'white'} />
      ) : (
        <Text className={['font-inter-semibold', isOutline ? 'text-base' : 'text-white'].join(' ')}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  )
}
