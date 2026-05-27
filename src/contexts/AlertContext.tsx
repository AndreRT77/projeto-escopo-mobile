import { Alert } from '@/components/ui/Alert'
import { createContext, ReactNode, useState } from 'react'

type AlertType = 'error' | 'success'

type AlertState = {
  visible: boolean
  message: string
  type: AlertType
}

type AlertContextData = {
  showAlert: (message: string, type?: AlertType) => void
}

export const AlertContext = createContext<AlertContextData>({} as AlertContextData)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    message: '',
    type: 'error',
  })

  function showAlert(message: string, type: AlertType = 'error') {
    setAlert({
      visible: true,
      message,
      type,
    })
  }

  function closeAlert() {
    setAlert((old) => ({
      ...old,
      visible: false,
    }))
  }

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      <Alert
        visible={alert.visible}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />
    </AlertContext.Provider>
  )
}
