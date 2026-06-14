import { zodResolver } from '@hookform/resolvers/zod'
import * as ImagePicker from 'expo-image-picker'
import { Camera, CreditCard, LogOut, PenLine, X } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Image, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { LabelWithTextInput } from '@/components/form/LabelWithTextInput'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { STORAGE_KEYS } from '@/constants/storage'
import { useAlert } from '@/hooks/useAlert'
import { useAuth } from '@/hooks/useAuth'
import {
  DeleteData,
  deleteSchema,
  PasswordData,
  passwordSchema,
} from '@/schemas/configuracao.schema'
import * as userService from '@/services/escopo-api/usuario'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'
import AsyncStorage from '@react-native-async-storage/async-storage'

const plans = [
  {
    name: 'Free',
    price: '$0',
    subtitle: 'Uso Acadêmico',
    features: ['2 colaboradores', '2 clientes', 'Transcrição de reuniões'],
  },
  {
    name: 'Standard',
    price: '$50',
    subtitle: 'Uso Comercial',
    features: ['4 colaboradores', '4 clientes', 'Transcrição de reuniões'],
  },
  {
    name: 'Premium',
    price: '$75',
    subtitle: 'Uso Comercial',
    features: ['Sem limite de colaboradores', 'Sem limite de clientes', 'Transcrição de reuniões'],
  },
]

function ModalPlanCard({ plan, index, onClose }: any) {
  return (
    <View className={`mb-4 rounded-[28px] p-6 ${index === 0 ? 'bg-cinza-100' : 'bg-white'}`}>
      <View className="items-center">
        <Text className="font-inter-bold text-xl text-cinza-700">{plan.name}</Text>
        <Text className="mt-2 font-inter-bold text-2xl text-purple-700">{plan.price}</Text>
        <Text className="mt-1 text-base text-cinza-500">{plan.subtitle}</Text>
      </View>

      <View className="mt-5 space-y-2">
        {plan.features.map((feature: string) => (
          <View key={feature} className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-purple-700" />
            <Text className="text-base text-cinza-700">{feature}</Text>
          </View>
        ))}
      </View>

      <View className="mt-6 items-center border-t border-purple-200 pt-4">
        <TouchableOpacity onPress={onClose}>
          <Text className="font-inter-bold text-purple-700">Fazer Upgrade</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function Configuracao() {
  const { showAlert } = useAlert()
  const { logout } = useAuth()
  const insets = useSafeAreaInsets()
  const scrollViewPadding = {
    paddingTop: 20,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }

  // Estados do Usuário
  const [userEmail, setUserEmail] = useState<string>('')
  const [nomeTemp, setNomeTemp] = useState('')
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  // Estados de UI
  const [loadingUserData, setLoadingUserData] = useState(true)
  const [editingNome, setEditingNome] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [showPlanos, setShowPlanos] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { isSubmitting: isPasswordSubmitting },
    reset: resetPasswordForm,
  } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { senhaAtual: '', novaSenha: '', confirmarSenha: '' },
  })

  const {
    control: deleteControl,
    handleSubmit: handleDeleteSubmit,
    formState: { isSubmitting: isDeleteSubmitting },
    reset: resetDeleteForm,
  } = useForm<DeleteData>({
    resolver: zodResolver(deleteSchema),
    defaultValues: { email: '' },
  })

  useEffect(() => {
    async function loadUserData() {
      try {
        const usuarioString = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER)

        if (!usuarioString) {
          showAlert('Usuário não encontrado. Por favor, faça login novamente.', 'error')
          setLoadingUserData(false)
          logout()
          return
        }

        const usuarioLogado = JSON.parse(usuarioString)
        const emailLogado = usuarioLogado.email

        if (!emailLogado) {
          showAlert('Usuário não encontrado. Por favor, faça login novamente.', 'error')
          setLoadingUserData(false)
          logout()
          return
        }

        const userData = await userService.getUserByEmail(emailLogado)

        setNomeTemp(userData.nome)
        setUserEmail(userData.email)
        setFotoPreview(userData.foto_perfil)
      } catch (err) {
        showAlert(extractApiErrorMessage(err), 'error')
      } finally {
        setLoadingUserData(false)
      }
    }

    loadUserData()
  }, [])

  async function handleFotoChange() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        const asset = result.assets[0]

        const imageFile = {
          uri: asset.uri,
          name: asset.fileName || 'profile_photo.jpg',
          type: asset.mimeType || 'image/jpeg',
        }

        setFotoPreview(asset.uri)

        const response = await userService.updatePhoto(imageFile as any)

        setFotoPreview(response.url)
        showAlert('Foto de perfil atualizada com sucesso!', 'success')
      }
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
    }
  }

  async function handleNomeSave() {
    if (!nomeTemp.trim()) {
      showAlert('O nome não pode estar vazio', 'error')
      return
    }

    try {
      setSavingName(true)
      await userService.updateName(nomeTemp.trim())
      setEditingNome(false)
      showAlert('Nome atualizado com sucesso!', 'success')
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
    } finally {
      setSavingName(false)
    }
  }

  async function onSavePassword(data: PasswordData) {
    try {
      await userService.updatePassword({
        senha_atual: data.senhaAtual,
        senha_nova: data.novaSenha,
      })
      resetPasswordForm()
      showAlert('Senha atualizada com sucesso!', 'success')
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
    }
  }

  async function onDeleteAccount(data: DeleteData) {
    if (data.email.toLowerCase() !== userEmail.toLowerCase()) {
      showAlert('O e-mail informado não corresponde à sua conta.', 'error')
      return
    }

    try {
      await userService.deleteUser()
      setShowDeleteConfirm(false)
      resetDeleteForm()
      showAlert('Conta excluída com sucesso.', 'success')
      logout()
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
    }
  }

  if (loadingUserData) {
    return <Loading />
  }

  return (
    <View className="flex-1 bg-cinza-100">
      <ScrollView
        className="flex-1 px-5 py-8 sm:px-8"
        contentContainerStyle={scrollViewPadding}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-md pb-8">
          {/* Sessão: Avatar */}
          <View className="items-center pt-4">
            <View className="relative">
              <View className="h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-purple-700 bg-cinza-200 shadow-sm">
                {fotoPreview ? (
                  <Image source={{ uri: fotoPreview }} className="h-full w-full" />
                ) : (
                  <Text className="font-inter-bold text-5xl text-cinza-500">
                    {nomeTemp.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={handleFotoChange}
                className="absolute bottom-1 right-1 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-purple-700 shadow-external"
              >
                <Camera size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sessão: Edição de Nome Inline */}
          <View className="mt-8 w-full items-center px-4">
            {editingNome ? (
              <View className="w-full">
                <TextInput
                  value={nomeTemp}
                  onChangeText={setNomeTemp}
                  editable={!savingName}
                  className="w-full rounded-2xl border-2 border-purple-700 bg-white px-4 py-3 text-center font-inter-bold text-2xl text-cinza-700 shadow-sm"
                />
                <View className="mt-4 flex-row gap-3">
                  <Button
                    onPress={handleNomeSave}
                    loading={savingName}
                    disabled={savingName}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onPress={() => setEditingNome(false)}
                    disabled={savingName}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </View>
              </View>
            ) : (
              <View className="flex-row items-center justify-center gap-3">
                <Text className="text-center font-inter-bold text-2xl text-cinza-700">
                  {nomeTemp}
                </Text>
                <TouchableOpacity onPress={() => setEditingNome(true)}>
                  <PenLine size={24} color="#7E22CE" />
                </TouchableOpacity>
              </View>
            )}

            {!editingNome && (
              <Text className="mt-1 text-center text-base text-cinza-500">{userEmail}</Text>
            )}
          </View>

          {/* Sessão: Alteração de Senha */}
          <View className="mt-12 rounded-[28px] bg-white p-6 shadow-external">
            <Text className="mb-6 font-inter-bold text-lg text-cinza-700">Alterar Senha</Text>

            <View className="gap-4">
              <LabelWithTextInput
                control={passwordControl}
                name="senhaAtual"
                label="Senha Atual"
                placeholder="Digite sua senha atual"
                secureTextEntry
              />

              <LabelWithTextInput
                control={passwordControl}
                name="novaSenha"
                label="Nova Senha"
                placeholder="Digite sua nova senha"
                secureTextEntry
              />

              <LabelWithTextInput
                control={passwordControl}
                name="confirmarSenha"
                label="Confirmar Nova Senha"
                placeholder="Confirme sua nova senha"
                secureTextEntry
              />
            </View>

            <Button
              className="mt-6 w-full"
              loading={isPasswordSubmitting}
              disabled={isPasswordSubmitting}
              onPress={handlePasswordSubmit(onSavePassword)}
            >
              Atualizar Senha
            </Button>
          </View>

          {/* Sessão: Outras Ações */}
          <View className="mt-8 gap-4 px-2">
            <TouchableOpacity
              onPress={() => setShowPlanos(true)}
              className="flex-row items-center justify-center gap-3 rounded-xl bg-purple-100 p-4"
            >
              <CreditCard size={24} color="#7E22CE" />
              <Text className="font-inter-bold text-lg text-purple-700">Ver Planos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={logout}
              className="flex-row items-center justify-center gap-3 rounded-xl border border-cinza-300 bg-white p-4"
            >
              <LogOut size={24} color="#6B7280" />
              <Text className="font-inter-bold text-lg text-cinza-700">Sair da Conta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(true)}
              className="mt-4 flex-row items-center justify-center"
            >
              <Text className="font-inter-bold text-base text-red-500">Deletar minha conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modais */}
      <Modal
        transparent
        visible={showPlanos}
        animationType="fade"
        onRequestClose={() => setShowPlanos(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="relative max-h-[80%] w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-external">
            <TouchableOpacity
              onPress={() => setShowPlanos(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-cinza-100 p-2"
            >
              <X size={20} color="#374151" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
              {plans.map((plan, index) => (
                <ModalPlanCard
                  key={plan.name}
                  plan={plan}
                  index={index}
                  onClose={() => setShowPlanos(false)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={showDeleteConfirm}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="relative w-full max-w-md rounded-[36px] bg-white px-6 py-10 shadow-external">
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(false)}
              disabled={isDeleteSubmitting}
              className="absolute right-6 top-6 z-10"
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>

            <Text className="mb-4 text-center font-inter-bold text-2xl text-cinza-700">
              Deletar conta?
            </Text>

            <Text className="mb-8 text-center text-base text-cinza-600">
              Para prosseguir digite o e-mail de cadastro. Esta ação não pode ser desfeita.
            </Text>

            <View className="gap-5">
              <LabelWithTextInput
                control={deleteControl}
                name="email"
                label="E-mail"
                keyboardType="email-address"
                placeholder="Digite seu e-mail"
              />

              <View className="mt-2 flex-col gap-3">
                <Button
                  loading={isDeleteSubmitting}
                  disabled={isDeleteSubmitting}
                  onPress={handleDeleteSubmit(onDeleteAccount)}
                  className="bg-red-500"
                >
                  Confirmar Exclusão
                </Button>
                <Button
                  variant="outline"
                  onPress={() => setShowDeleteConfirm(false)}
                  disabled={isDeleteSubmitting}
                >
                  Cancelar
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
