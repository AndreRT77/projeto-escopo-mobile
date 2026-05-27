import { useContext } from 'react'

import { AlertContext } from '@/contexts/AlertContext'

export function useAlert() {
  const context = useContext(AlertContext)

  return context
}
