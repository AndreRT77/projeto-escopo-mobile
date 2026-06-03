import { Text } from '@/components/ui/Text'
import { Check, ChevronDown } from 'lucide-react-native'
import React, { useState } from 'react'
import { Modal, ScrollView, TouchableOpacity, View } from 'react-native'

interface Option {
  id: string | number
  label: string
}

interface SelectProps {
  label?: string
  options: Option[]
  selectedValue: string | number
  onValueChange: (value: string | number) => void
  placeholder?: string
  disabled?: boolean
  triggerClassName?: string
  textClassName?: string
  iconSize?: number
}

export function Select({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Selecione uma opção',
  disabled = false,
  triggerClassName,
  textClassName,
  iconSize,
}: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false)

  const selectedOption = options.find((opt) => opt.id === selectedValue)

  function handleSelect(value: string | number) {
    onValueChange(value)
    setModalVisible(false)
  }

  return (
    <View className="w-full">
      {label && <Text className="mb-2 ml-1 font-inter-medium text-cinza-700">{label}</Text>}

      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={() => setModalVisible(true)}
        className={`flex-row items-center justify-between rounded-lg border-2 border-cinza-300 bg-white px-4 py-4
          ${disabled ? 'bg-cinza-100 opacity-60' : ''}
          ${triggerClassName || ''} // <--- Aplica classes de tamanho extra aqui
        `}
      >
        <Text
          className={`font-inter text-base ${
            selectedOption ? 'text-cinza-700' : 'text-cinza-400'
          } ${textClassName || ''}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={iconSize || 20} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Estrutura do Dropdown/Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Backdrop (Fundo escurecido clicável) */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          className="flex-1 justify-end bg-black/40"
        >
          {/* Container das Opções */}
          <View className="max-h-[50%] w-full rounded-t-2xl bg-white p-5 pb-8 shadow-xl">
            {/* Cabeçalho do Modal */}
            <View className="mb-4 flex-row items-center justify-between border-b border-cinza-200 pb-3">
              <Text className="font-inter-bold text-lg text-cinza-700">
                {label || 'Selecione uma opção'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="font-inter-semibold text-purple-700">Fechar</Text>
              </TouchableOpacity>
            </View>

            {/* Lista com Rolagem das Opções */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-1">
                {options.map((option) => {
                  const isSelected = option.id === selectedValue

                  return (
                    <TouchableOpacity
                      key={option.id}
                      activeOpacity={0.6}
                      onPress={() => handleSelect(option.id)}
                      className={`flex-row items-center justify-between rounded-lg p-4
                        ${isSelected ? 'bg-purple-50' : 'active:bg-cinza-100'}
                      `}
                    >
                      <Text
                        className={`font-inter text-base ${
                          isSelected ? 'font-inter-semibold text-purple-700' : 'text-cinza-700'
                        }`}
                      >
                        {option.label}
                      </Text>
                      {isSelected && <Check size={18} color="#7C3AED" />}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
