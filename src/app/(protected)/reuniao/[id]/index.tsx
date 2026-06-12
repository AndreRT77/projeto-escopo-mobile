import { zodResolver } from '@hookform/resolvers/zod'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronsLeft, PencilLine, Plus, Trash2 } from 'lucide-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, Image, Linking, Modal, ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import USER_DEFAULT_IMAGE from '@/assets/images/icons/user-default.jpg'
import { LabelWithTextInput } from '@/components/form/LabelWithTextInput'
import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import {
  AdicionarConvidadoData,
  AdicionarUsuarioData,
  CriarLinkData,
  EditarGravacaoData,
  adicionarConvidadoSchema,
  adicionarUsuarioSchema,
  atualizarTituloReuniaoData,
  atualizarTituloReuniaoSchema,
  criarLinkSchema,
  editarGravacaoSchema,
} from '@/schemas/reuniao.schema'
import * as convidadoReuniaoService from '@/services/escopo-api/convidado-reuniao'
import * as linkReuniaoService from '@/services/escopo-api/link-reuniao'
import * as reuniaoService from '@/services/escopo-api/reuniao'
import * as usuarioService from '@/services/escopo-api/usuario'
import * as usuarioReuniaoService from '@/services/escopo-api/usuario-reuniao'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'
import axios from 'axios'

export default function DetailsMeeting() {
  const { id, nivelAcessoId } = useLocalSearchParams<{
    id: string
    nivelAcessoId: string
  }>()
  const router = useRouter()
  const { showAlert } = useAlert()

  const canEdit = Number(nivelAcessoId) === 1 || Number(nivelAcessoId) === 2

  const [detalhesReuniao, setDetalhesReuniao] = useState<reuniaoService.DetalhesReuniao>()
  const [loading, setLoading] = useState(true)

  const [modalGravacaoVisible, setModalGravacaoVisible] = useState(false)
  const [modalTranscricaoVisible, setModalTranscricaoVisible] = useState(false)
  const [modalAddLinkVisible, setModalAddLinkVisible] = useState(false)
  const [modalAddUsuarioVisible, setModalAddUsuarioVisible] = useState(false)
  const [modalAddConvidadoVisible, setModalAddConvidadoVisible] = useState(false)
  const [modalEditarConvidadoVisible, setModalEditarConvidadoVisible] = useState(false)

  const [modalEditarTituloVisible, setModalEditarTituloVisible] = useState(false)

  const [linkGravacaoEditId, setLinkGravacaoEditId] = useState<number | null>(null)
  const [convidadoEditId, setConvidadoEditId] = useState<number | null>(null)

  const {
    control: controlTitulo,
    handleSubmit: handleSubmitTitulo,
    setValue: setValueTitulo,
  } = useForm<atualizarTituloReuniaoData>({
    resolver: zodResolver(atualizarTituloReuniaoSchema),
    defaultValues: { titulo: '' },
  })

  const {
    control: controlEditarConvidado,
    handleSubmit: handleSubmitEditarConvidado,
    setValue: setValueEditarConvidado,
    reset: resetEditarConvidado,
  } = useForm<AdicionarConvidadoData>({
    resolver: zodResolver(adicionarConvidadoSchema),
    defaultValues: { nome: '', cargo: '' },
  })

  const {
    control: controlGravacao,
    handleSubmit: handleSubmitGravacao,
    setValue: setValueGravacao,
    reset: resetGravacao,
  } = useForm<EditarGravacaoData>({
    resolver: zodResolver(editarGravacaoSchema),
    defaultValues: { nome: '', url: '' },
  })

  const {
    control: controlLink,
    handleSubmit: handleSubmitLink,
    reset: resetLink,
  } = useForm<CriarLinkData>({
    resolver: zodResolver(criarLinkSchema),
    defaultValues: { nome: '', url: '' },
  })

  const {
    control: controlUsuario,
    handleSubmit: handleSubmitUsuario,
    reset: resetUsuario,
  } = useForm<AdicionarUsuarioData>({
    resolver: zodResolver(adicionarUsuarioSchema),
    defaultValues: { email: '' },
  })

  const {
    control: controlConvidado,
    handleSubmit: handleSubmitConvidado,
    reset: resetConvidado,
  } = useForm<AdicionarConvidadoData>({
    resolver: zodResolver(adicionarConvidadoSchema),
    defaultValues: { nome: '', cargo: '' },
  })

  const carregarReuniao = useCallback(async () => {
    try {
      const data = await reuniaoService.obterDetalhesDeUmaReuniao(String(id))
      setDetalhesReuniao(data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        router.replace('/not-found')
        return
      }

      showAlert(extractApiErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    carregarReuniao()
  }, [carregarReuniao])

  function gerarIniciais(nomeCompleto: string) {
    if (!nomeCompleto) return ''
    return nomeCompleto
      .split(' ')
      .map((parte) => parte[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const formatarData = (dataString: string | undefined) => {
    if (!dataString) return ''
    return new Date(dataString).toLocaleDateString('pt-BR')
  }

  function handleDeleteReuniao() {
    Alert.alert('Excluir Reunião', 'Tem certeza que deseja excluir esta reunião?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true)
            await reuniaoService.excluirReuniao(String(id))
            router.back()
            showAlert('Reunião excluída com sucesso', 'success')
          } catch (err) {
            showAlert(extractApiErrorMessage(err), 'error')
            setLoading(false)
          }
        },
      },
    ])
  }

  async function handleOpenLink(url: string) {
    try {
      await Linking.openURL(url)
    } catch (error) {
      showAlert('Não foi possível abrir este link.', 'error')
    }
  }

  function handleDeleteLink(linkId: number) {
    Alert.alert('Excluir Link', 'Deseja excluir este link adicional?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await linkReuniaoService.excluirLink(linkId)
            showAlert('Link excluído com sucesso', 'success')
            carregarReuniao()
          } catch (err) {
            showAlert(extractApiErrorMessage(err), 'error')
          }
        },
      },
    ])
  }

  async function adicionarUsuario(data: AdicionarUsuarioData) {
    try {
      const userRes = await usuarioService.getUserByEmail(data.email)
      try {
        await usuarioReuniaoService.criarUsuario(String(id), { usuario_id: userRes.id })
        setModalAddUsuarioVisible(false)
        resetUsuario()
        carregarReuniao()
        showAlert('Usuário adicionado com sucesso', 'success')
      } catch (err) {
        showAlert(extractApiErrorMessage(err), 'error')
      }
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
    }
  }

  function handleDeleteUsuario(usuarioId: number) {
    Alert.alert('Remover Participante', 'Deseja remover este participante da reunião?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await usuarioReuniaoService.excluirUsuario(usuarioId, id)
            showAlert('Participante removido com sucesso', 'success')
            carregarReuniao()
          } catch (err) {
            showAlert(extractApiErrorMessage(err), 'error')
          }
        },
      },
    ])
  }

  async function criarLinkAdicional(data: CriarLinkData) {
    try {
      await linkReuniaoService.criarLink(String(id), {
        tipo_link_id: 2,
        nome: data.nome || null,
        url: data.url,
      })
      setModalAddLinkVisible(false)
      resetLink()
      carregarReuniao()
      showAlert('Link adicionado com sucesso', 'success')
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
    }
  }

  async function adicionarConvidado(data: AdicionarConvidadoData) {
    try {
      await convidadoReuniaoService.criarConvidado(String(id), {
        nome: data.nome,
        cargo: data.cargo || null,
      })
      setModalAddConvidadoVisible(false)
      resetConvidado()
      carregarReuniao()
      showAlert('Convidado adicionado com sucesso', 'success')
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
    }
  }

  function handleDeleteConvidado(convidadoId: number) {
    Alert.alert('Remover Convidado', 'Deseja remover este convidado da reunião?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await convidadoReuniaoService.excluirConvidado(convidadoId)
            showAlert('Convidado removido com sucesso', 'success')
            carregarReuniao()
          } catch (err) {
            showAlert(extractApiErrorMessage(err), 'error')
          }
        },
      },
    ])
  }

  async function salvarOuCriarGravacao(data: EditarGravacaoData) {
    try {
      if (linkGravacaoEditId) {
        // Modo Edição
        await linkReuniaoService.atualizarLink(linkGravacaoEditId, {
          nome: data.nome || null,
          url: data.url,
        })
        showAlert('Link de gravação atualizado', 'success')
      } else {
        // Modo Criação (tipo_link_id: 1 para gravação)
        await linkReuniaoService.criarLink(String(id), {
          tipo_link_id: 1,
          nome: data.nome || null,
          url: data.url,
        })
        showAlert('Link de gravação adicionado', 'success')
      }
      setModalGravacaoVisible(false)
      resetGravacao()
      carregarReuniao()
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
    }
  }

  async function salvarEdicaoConvidado(data: AdicionarConvidadoData) {
    try {
      if (!convidadoEditId) return

      await convidadoReuniaoService.atualizarConvidado(convidadoEditId, {
        nome: data.nome,
        cargo: data.cargo || null,
      })

      setModalEditarConvidadoVisible(false)
      resetEditarConvidado({ nome: '', cargo: '' })
      carregarReuniao()
      showAlert('Convidado atualizado com sucesso', 'success')
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
    }
  }

  async function salvarEdicaoTitulo(data: atualizarTituloReuniaoData) {
    try {
      await reuniaoService.atualizarTitulo(id, data)
      setModalEditarTituloVisible(false)
      carregarReuniao()
      showAlert('Título atualizado com sucesso', 'success')
    } catch (err) {
      showAlert(extractApiErrorMessage(err), 'error')
    }
  }

  if (loading) {
    return <Loading />
  }

  const gravacaoExistente = detalhesReuniao?.links?.find((l) => l.tipo_link === 'reuniao')

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between border-b border-cinza-300 px-4 pb-3">
        <View className="flex-1 flex-row items-center gap-3">
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <ChevronsLeft className="text-cinza-800 h-9 w-9" />
          </TouchableOpacity>

          <View className="flex-1 flex-col">
            <View className="flex-row items-center gap-2">
              <Text numberOfLines={1} className="text-cinza-800 shrink font-inter-bold text-xl">
                {detalhesReuniao?.titulo || 'Reunião'}
              </Text>
              {canEdit && (
                <TouchableOpacity
                  onPress={() => {
                    setValueTitulo('titulo', detalhesReuniao?.titulo || '')
                    setModalEditarTituloVisible(true)
                  }}
                  className="p-1"
                >
                  <PencilLine size={16} className="text-cinza-500" />
                </TouchableOpacity>
              )}
            </View>

            <Text className="font-inter-regular text-xs text-cinza-500">
              Realizado em: {formatarData(detalhesReuniao?.criado_em)}
            </Text>
          </View>
        </View>

        {canEdit && (
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-xl bg-base"
            onPress={handleDeleteReuniao}
          >
            <Trash2 size={20} color={'white'} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* CARD: GRAVAÇÃO DA REUNIÃO */}
        <View className="mt-4 w-full flex-col gap-3 rounded-2xl border border-cinza-300 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-inter-semibold text-base text-cinza-600">
              Gravação da Reunião
            </Text>

            {canEdit && (
              <TouchableOpacity
                className="p-1"
                onPress={() => {
                  if (gravacaoExistente) {
                    setLinkGravacaoEditId(gravacaoExistente.id)
                    setValueGravacao('nome', gravacaoExistente.nome || '')
                    setValueGravacao('url', gravacaoExistente.url)
                  } else {
                    setLinkGravacaoEditId(null)
                    resetGravacao({ nome: '', url: '' })
                  }
                  setModalGravacaoVisible(true)
                }}
              >
                {gravacaoExistente ? (
                  <PencilLine size={16} className="text-cinza-800" />
                ) : (
                  <Plus size={18} className="text-cinza-800" />
                )}
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row items-center gap-3">
            {gravacaoExistente ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleOpenLink(gravacaoExistente.url)}
                className="rounded-xl bg-base px-4 py-2.5"
              >
                <Text className="font-inter-medium text-sm text-white">Acessar Gravação</Text>
              </TouchableOpacity>
            ) : (
              <Text className="font-inter-regular text-sm italic text-cinza-500">
                Nenhuma gravação registrada.
              </Text>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              className="py-2"
              onPress={() => setModalTranscricaoVisible(true)}
            >
              <Text className="font-inter-medium text-sm underline">Transcrição</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD: LINKS ADICIONAIS */}
        <View className="mt-4 w-full flex-col rounded-2xl border border-cinza-300 p-4">
          <Text className="mb-2 font-inter-semibold text-sm text-cinza-600">Links Adicionais</Text>

          {detalhesReuniao?.links
            ?.filter((link: any) => link.tipo_link === 'link_adicional')
            .map((link: any) => (
              <View key={link.id} className="flex-row items-center justify-between py-1.5">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenLink(link.url)}
                  className="flex-1"
                >
                  <Text numberOfLines={1} className="font-inter-regular text-sm underline">
                    {link.nome}
                  </Text>
                </TouchableOpacity>

                {canEdit && (
                  <TouchableOpacity className="p-1" onPress={() => handleDeleteLink(link.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

          {canEdit && (
            <TouchableOpacity
              activeOpacity={0.7}
              className="mt-3 w-full items-center justify-center rounded-xl border border-dashed border-purple-400 py-2.5"
              onPress={() => setModalAddLinkVisible(true)}
            >
              <Text className="font-inter-medium text-sm text-purple-600">+ Adicionar link</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CARD: PARTICIPANTES */}
        <View className="mt-4 w-full flex-col rounded-2xl border border-cinza-300 p-4">
          <Text className="mb-2 font-inter-semibold text-sm text-cinza-600">Participantes</Text>

          {detalhesReuniao?.usuarios?.map((usuario: any, index: number) => (
            <View
              key={`${usuario.id}-${index}`}
              className="flex-row items-center justify-between border-b border-cinza-100 py-3"
            >
              <View className="flex-row items-center gap-3">
                <Image
                  source={usuario.foto_perfil ? { uri: usuario.foto_perfil } : USER_DEFAULT_IMAGE}
                  className="h-10 w-10 rounded-full bg-cinza-200"
                />
                <Text className="text-cinza-800 font-inter-medium text-sm">{usuario.nome}</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Text className="font-inter-regular text-xs text-cinza-500">{usuario.cargo}</Text>
                {canEdit && (
                  <TouchableOpacity className="p-1" onPress={() => handleDeleteUsuario(usuario.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {canEdit && (
            <TouchableOpacity
              activeOpacity={0.7}
              className="bg-cinza-50 mt-3 w-full items-center justify-center rounded-xl border border-cinza-200 py-2.5"
              onPress={() => setModalAddUsuarioVisible(true)}
            >
              <Text className="font-inter-medium text-sm text-cinza-700">Novo Participante</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CARD: CONVIDADOS */}
        <View className="mt-4 w-full flex-col rounded-2xl border border-cinza-300 p-4">
          <Text className="mb-2 font-inter-semibold text-sm text-cinza-600">Convidados</Text>

          {detalhesReuniao?.convidados?.map((convidado: any) => (
            <View
              key={convidado.id}
              className="flex-row items-center justify-between border-b border-cinza-100 py-3"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-cinza-200">
                  <Text className="font-inter-semibold text-xs text-cinza-600">
                    {gerarIniciais(convidado.nome)}
                  </Text>
                </View>
                <Text className="text-cinza-800 font-inter-medium text-sm">{convidado.nome}</Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Text className="font-inter-regular text-xs text-cinza-500">{convidado.cargo}</Text>
                {canEdit && (
                  <>
                    <TouchableOpacity
                      className="p-1"
                      onPress={() => {
                        setConvidadoEditId(convidado.id)
                        setValueEditarConvidado('nome', convidado.nome)
                        setValueEditarConvidado('cargo', convidado.cargo || '')
                        setModalEditarConvidadoVisible(true)
                      }}
                    >
                      <PencilLine size={16} className="text-cinza-600" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="p-1"
                      onPress={() => handleDeleteConvidado(convidado.id)}
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}

          {canEdit && (
            <TouchableOpacity
              activeOpacity={0.7}
              className="bg-cinza-50 mt-3 w-full items-center justify-center rounded-xl border border-cinza-200 py-2.5"
              onPress={() => setModalAddConvidadoVisible(true)}
            >
              <Text className="font-inter-medium text-sm text-cinza-700">Novo Convidado</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ================= MODAIS ================= */}

      <Modal visible={modalEditarTituloVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full gap-3 rounded-2xl bg-white p-5">
            <Text className="text-cinza-800 mb-2 font-inter-bold text-lg">Editar Título</Text>

            <LabelWithTextInput
              control={controlTitulo}
              name="titulo"
              label="Nome da Reunião"
              placeholder="Ex: Alinhamento Semanal"
            />

            <View className="mt-2 flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => {
                  setModalEditarTituloVisible(false)
                  setValueTitulo('titulo', detalhesReuniao?.titulo || '')
                }}
                className="rounded-xl bg-cinza-200 px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-cinza-700">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitTitulo(salvarEdicaoTitulo)}
                className="rounded-xl bg-base px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-white">Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalGravacaoVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full gap-3 rounded-2xl bg-white p-5">
            <Text className="text-cinza-800 mb-2 font-inter-bold text-lg">
              {linkGravacaoEditId ? 'Editar Gravação' : 'Adicionar Gravação'}
            </Text>

            <LabelWithTextInput
              control={controlGravacao}
              name="nome"
              label="Nome da Gravação"
              placeholder="Ex: Reunião de Alinhamento"
            />

            <LabelWithTextInput
              control={controlGravacao}
              name="url"
              label="URL"
              placeholder="https://..."
            />

            <View className="mt-2 flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => {
                  setModalGravacaoVisible(false)
                  resetGravacao({ nome: '', url: '' })
                }}
                className="rounded-xl bg-cinza-200 px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-cinza-700">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitGravacao(salvarOuCriarGravacao)}
                className="rounded-xl bg-base px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-white">Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalAddLinkVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full gap-3 rounded-2xl bg-white p-5">
            <Text className="text-cinza-800 mb-2 font-inter-bold text-lg">Novo Link Adicional</Text>

            <LabelWithTextInput
              control={controlLink}
              name="nome"
              label="Nome do Link"
              placeholder="Ex: Documento de Requisitos"
            />

            <LabelWithTextInput
              control={controlLink}
              name="url"
              label="URL do link"
              placeholder="https://..."
            />

            <View className="mt-2 flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => {
                  setModalAddLinkVisible(false)
                  resetLink()
                }}
                className="rounded-xl bg-cinza-200 px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-cinza-700">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitLink(criarLinkAdicional)}
                className="rounded-xl bg-base px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-white">Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalAddUsuarioVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full gap-3 rounded-2xl bg-white p-5">
            <Text className="text-cinza-800 mb-2 font-inter-bold text-lg">
              Adicionar Participante
            </Text>

            <LabelWithTextInput
              control={controlUsuario}
              name="email"
              label="Email"
              placeholder="email@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View className="mt-2 flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => {
                  setModalAddUsuarioVisible(false)
                  resetUsuario()
                }}
                className="rounded-xl bg-cinza-200 px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-cinza-700">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitUsuario(adicionarUsuario)}
                className="rounded-xl bg-base px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-white">Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalAddConvidadoVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full gap-3 rounded-2xl bg-white p-5">
            <Text className="text-cinza-800 mb-2 font-inter-bold text-lg">Novo Convidado</Text>

            <LabelWithTextInput
              control={controlConvidado}
              name="nome"
              label="Nome do Convidado"
              placeholder="Ex: João Silva"
            />

            <LabelWithTextInput
              control={controlConvidado}
              name="cargo"
              label="Cargo (Opcional)"
              placeholder="Ex: Desenvolvedor"
            />

            <View className="mt-2 flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => {
                  setModalAddConvidadoVisible(false)
                  resetConvidado()
                }}
                className="rounded-xl bg-cinza-200 px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-cinza-700">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitConvidado(adicionarConvidado)}
                className="rounded-xl bg-base px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-white">Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalEditarConvidadoVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 p-4">
          <View className="w-full gap-3 rounded-2xl bg-white p-5">
            <Text className="text-cinza-800 mb-2 font-inter-bold text-lg">Editar Convidado</Text>

            <LabelWithTextInput
              control={controlEditarConvidado}
              name="nome"
              label="Nome do Convidado"
              placeholder="Ex: João Silva"
            />

            <LabelWithTextInput
              control={controlEditarConvidado}
              name="cargo"
              label="Cargo (Opcional)"
              placeholder="Ex: Desenvolvedor"
            />

            <View className="mt-2 flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => {
                  setModalEditarConvidadoVisible(false)
                  resetEditarConvidado()
                }}
                className="rounded-xl bg-cinza-200 px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-cinza-700">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitEditarConvidado(salvarEdicaoConvidado)}
                className="rounded-xl bg-base px-4 py-2"
              >
                <Text className="font-inter-medium text-sm text-white">Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalTranscricaoVisible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white p-5 pt-10">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-cinza-800 font-inter-bold text-xl">Transcrição da Reunião</Text>
            <TouchableOpacity onPress={() => setModalTranscricaoVisible(false)}>
              <Text className="font-inter-medium text-base text-sm">Fechar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1">
            <Text className="font-inter-regular text-base text-cinza-700">
              {/* TODO: Implementar transcrição aqui futuramente */}A transcrição da reunião
              aparecerá aqui em futuras atualizações...
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
