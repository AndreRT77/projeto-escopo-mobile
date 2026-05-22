import { Text } from '@/components/ui/Text'
import { Controller } from 'react-hook-form'
import { TextInput, View } from 'react-native'

type LabelWithTextInputProps = {
  control: any
  name: string
  label: string
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

export function LabelWithTextInput({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: LabelWithTextInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View>
          <Text className="mb-2 ml-1 font-inter-medium text-cinza-700">{label}</Text>

          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            className="rounded-lg border-2 border-cinza-300 px-4 py-4 font-inter text-cinza-700"
          />

          {error && <Text className="ml-1 mt-1 text-sm text-red-500">{error.message}</Text>}
        </View>
      )}
    />
  )
}
