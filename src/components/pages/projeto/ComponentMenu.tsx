import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Text } from '@/components/ui/Text'

interface ComponentMenuProps {
  tabs: string[]
  currentTab: string
  setCurrentTab: (tab: string) => void
}

export default function ComponentMenu({ tabs, currentTab, setCurrentTab }: ComponentMenuProps) {
  return (
    <View className="flex-row items-center justify-between">
      {tabs.map((tab) => {
        const isActive = currentTab === tab
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => setCurrentTab(tab)}
            className={`rounded-full px-4 py-2 ${isActive ? 'bg-purple-100' : 'bg-cinza-200'}`}
          >
            <Text
              className={`text-sm ${
                isActive ? 'font-inter-bold text-purple-700' : 'text-cinza-700'
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
