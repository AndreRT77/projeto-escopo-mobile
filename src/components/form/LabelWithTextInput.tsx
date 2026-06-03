import { Text } from '@/components/ui/Text'
import { Controller } from 'react-hook-form'
import { TextInput, TextInputProps, View } from 'react-native'

type LabelWithTextInputProps = TextInputProps & {
  control: any
  name: string
  label: string
  rules?: any
}

export function LabelWithTextInput({
  control,
  name,
  label,
  rules,
  className,
  ...rest
}: LabelWithTextInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View>
          <Text className="mb-2 ml-1 font-inter-medium text-cinza-700">{label}</Text>

          <TextInput
            value={value}
            onChangeText={onChange}
            placeholderTextColor="#9CA3AF"
            {...rest}
            className={`rounded-lg border-2 border-cinza-300 px-4 py-4 font-inter text-cinza-700 ${
              rest.multiline ? 'h-24' : ''
            } ${className || ''}`}
            textAlignVertical={rest.multiline ? 'top' : 'auto'}
          />

          {error && <Text className="ml-1 mt-1 text-sm text-red-500">{error.message}</Text>}
        </View>
      )}
    />
  )
}
