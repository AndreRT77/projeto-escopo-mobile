import { Search, X } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Image, TouchableOpacity, View } from 'react-native'

import { LabelWithTextInput } from '@/components/form/LabelWithTextInput'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { Integrante, ProjectFormData } from '@/schemas/form-projeto.schema'
import * as projetoService from '@/services/escopo-api/projeto'
import * as usuarioService from '@/services/escopo-api/usuario'

interface ProjectFormProps {
  mode: 'create' | 'edit'
  initialData: any
  onSubmit: (data: any) => Promise<void>
  userEmail: string
  projectId?: string | null
  onError: (message: string) => void
}

interface ProjectMemberProps {
  integrante: Integrante
  id: string | number
  isOwner?: boolean
  adicional?: boolean
  pendente?: boolean
  onClose: () => void
  onNivelAcessoChange: (id: string | number, novoNivel: number) => void
}

const NIVEIS_ACESSO = [
  { id: 1, label: 'Gerente' },
  { id: 2, label: 'Analista' },
  { id: 3, label: 'Dev' },
  { id: 4, label: 'Cliente' },
]

function ProjectMember({
  integrante,
  id,
  isOwner = false,
  adicional = false,
  pendente = false,
  onClose,
  onNivelAcessoChange,
}: ProjectMemberProps) {
  function handleSelectNivelAcesso() {
    if (isOwner) return

    const currentIndex = NIVEIS_ACESSO.findIndex((n) => n.id === integrante.nivel_acesso_id)
    const nextIndex = (currentIndex + 1) % NIVEIS_ACESSO.length
    onNivelAcessoChange(id, NIVEIS_ACESSO[nextIndex].id)
  }

  const currentNivelLabel = NIVEIS_ACESSO.find(
    (n) => n.id === (integrante.nivel_acesso_id || 4),
  )?.label

  return (
    <View
      className={`mb-2 w-full flex-row items-center justify-between rounded-xl border bg-cinza-100 p-3
        ${isOwner ? 'border-transparent bg-cinza-200' : 'border-transparent'}
        ${pendente ? 'border-transparent opacity-70' : ''}
        ${adicional ? 'border-purple-300 bg-purple-50' : ''}
      `}
    >
      <View className="mr-2 flex-1 flex-row items-center gap-3">
        <Image
          source={{
            uri:
              integrante.fotoPerfil ||
              'https://upload.wikimedia.org/wikipedia/commons/2/2f/No-photo-m.png',
          }}
          className="h-9 w-9 rounded-full bg-cinza-300"
        />
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className={`font-inter-semibold text-sm text-cinza-700
              ${pendente ? 'text-cinza-400' : ''}
              ${adicional ? 'text-purple-900' : ''}
            `}
          >
            {integrante.nome}
          </Text>

          {isOwner && (
            <Text className="font-inter-regular text-xs text-cinza-500">Proprietário(a)</Text>
          )}
          {pendente && (
            <Text className="font-inter-regular text-xs text-cinza-400">(Convite pendente)</Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          disabled={isOwner}
          onPress={handleSelectNivelAcesso}
          className={`min-w-[80px] items-center rounded-lg border border-cinza-300 bg-white px-2 py-1.5
            ${isOwner ? 'bg-cinza-100 opacity-50' : ''}
            ${adicional ? 'border-purple-300 bg-purple-100' : ''}
          `}
        >
          <Text className="font-inter-medium text-xs text-cinza-700">{currentNivelLabel}</Text>
        </TouchableOpacity>

        {!isOwner && (
          <TouchableOpacity onPress={onClose} className="p-1">
            <X size={18} color="#4B5563" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default function ProjectForm({
  mode,
  initialData,
  onSubmit,
  userEmail,
  projectId = null,
  onError,
}: ProjectFormProps) {
  const [integrantesAtuais, setIntegrantesAtuais] = useState<Integrante[]>([])
  const [integrantesAdicionais, setIntegrantesAdicionais] = useState<Integrante[]>([])
  const [pendentes, setPendentes] = useState<Integrante[]>([])
  const [emailError, setEmailError] = useState('')
  const [integrantesExcluidos, setIntegrantesExcluidos] = useState<(string | number)[]>([])
  const [convitesExcluidos, setConvitesExcluidos] = useState<(string | number)[]>([])

  const isEdit = mode === 'edit'

  const { control, handleSubmit, getValues, setValue, reset } = useForm<ProjectFormData>({
    defaultValues: {
      titulo: '',
      descricao: '',
      email: '',
    },
  })

  async function submitForm(data: ProjectFormData) {
    let formData
    if (!isEdit) {
      formData = {
        ...data,
        integrantes: integrantesAdicionais,
      }
    } else {
      formData = {
        ...data,
        integrantesAtuais,
        integrantesExcluidos,
        integrantesAdicionais,
        pendentes,
        convitesExcluidos,
      }
    }
    await onSubmit(formData)
  }

  async function inserirProprietario() {
    try {
      const usuario = await usuarioService.getUserByEmail(userEmail)

      const novoIntegrante: Integrante = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        fotoPerfil: usuario.foto_perfil,
        isOwner: true,
        nivel_acesso_id: 1,
      }

      setIntegrantesAtuais((prev) => {
        if (prev.some((i) => i.id === usuario.id)) return prev
        return [...prev, novoIntegrante]
      })
    } catch (error) {
      onError('Ocorreu uma falha na requisição do proprietário')
    }
  }

  useEffect(() => {
    if (!isEdit) {
      inserirProprietario()
      return
    }
    if (initialData) {
      reset({
        titulo: initialData.titulo,
        descricao: initialData.descricao,
        email: '',
      })
      initListaParticipantes(projectId)
    }
  }, [isEdit, initialData])

  async function initListaParticipantes(id: string | null) {
    if (!id) return
    try {
      const response = await projetoService.obterParticipantesDeUmProjeto(id)

      // Mapeamento dos participantes atuais
      const participantesMapeados: Integrante[] = response.participantes.map((p) => ({
        id: p.usuario_id,
        usuario_projeto_id: p.usuario_projeto_id,
        nome: p.nome,
        email: p.email,
        fotoPerfil: p.foto_perfil || undefined,
        isOwner: p.usuario_id === initialData?.criador_id,
        nivel_acesso_id: Number(p.nivel_acesso_id),
      }))

      // Mapeamento dos convites pendentes
      const pendentesMapeados: Integrante[] = response.pendentes.map((p) => ({
        id: p.convite_id, // Atende à exigência da interface Integrante
        convite_id: p.convite_id,
        nome: p.nome,
        email: p.email,
        fotoPerfil: p.foto_perfil || undefined,
        nivel_acesso_id: Number(p.nivel_acesso_id),
      }))

      setIntegrantesAtuais(participantesMapeados)
      setPendentes(pendentesMapeados)
    } catch (error) {
      onError('Erro ao carregar membros do projeto.')
    }
  }

  async function handleAddIntegranteAdicional() {
    const emailBusca = getValues('email')

    if (!emailBusca?.trim()) {
      setEmailError('Insira um email para realizar a busca.')
      return
    }

    const jaExiste =
      integrantesAtuais.some((i) => i.email === emailBusca) ||
      pendentes.some((p) => p.email === emailBusca) ||
      integrantesAdicionais.some((a) => a.email === emailBusca)

    if (jaExiste) {
      setEmailError('Esse usuário já foi adicionado')
      return
    }

    try {
      const usuario = await usuarioService.getUserByEmail(emailBusca)
      const novoIntegrante: Integrante = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        fotoPerfil: usuario.foto_perfil,
        nivel_acesso_id: 4,
      }

      setValue('email', '')
      setIntegrantesAdicionais((prev) => [...prev, novoIntegrante])
    } catch (error) {
      onError('Usuário não encontrado')
    }
  }

  function atualizarNivelAcesso(
    setList: React.Dispatch<React.SetStateAction<Integrante[]>>,
    key: keyof Integrante,
    idValue: string | number,
    novoNivel: number,
  ) {
    setList((prev) =>
      prev.map((item) => (item[key] === idValue ? { ...item, nivel_acesso_id: novoNivel } : item)),
    )
  }

  return (
    <View className="flex-col gap-5 pb-10">
      <LabelWithTextInput
        control={control}
        name="titulo"
        label="Título do Projeto"
        placeholder="Novo Projeto"
        rules={{ required: 'O título precisa ser preenchido' }}
      />

      <LabelWithTextInput
        control={control}
        name="descricao"
        label="Sobre o projeto"
        placeholder="Insira uma breve descrição sobre o projeto"
        multiline
        numberOfLines={3}
      />

      <View className="relative w-full">
        <LabelWithTextInput
          control={control}
          name="email"
          label="Integrantes"
          placeholder="Buscar por email"
          rules={{ onChange: () => setEmailError('') }}
        />
        <TouchableOpacity
          onPress={handleAddIntegranteAdicional}
          className="absolute bottom-3 right-4 p-1"
        >
          <Search size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      {emailError ? <Text className="mt-1 text-sm text-red-500">{emailError}</Text> : null}

      <View className="mt-4 gap-4">
        <View className="flex-row justify-between px-2">
          <Text className="font-inter-bold text-cinza-600">Nome</Text>
          <Text className="font-inter-bold text-cinza-600">Nível de acesso</Text>
        </View>

        {integrantesAtuais.map((integrante) => (
          <ProjectMember
            key={integrante.usuario_projeto_id || integrante.id}
            integrante={integrante}
            id={integrante.usuario_projeto_id || integrante.id}
            isOwner={integrante.isOwner}
            onClose={() => {
              const targetId = integrante.usuario_projeto_id || integrante.id
              setIntegrantesAtuais((prev) =>
                prev.filter((i) => (i.usuario_projeto_id || i.id) !== targetId),
              )
              if (integrante.usuario_projeto_id)
                setIntegrantesExcluidos((prev) => [...prev, integrante.usuario_projeto_id!])
            }}
            onNivelAcessoChange={(id, nivel) =>
              atualizarNivelAcesso(
                setIntegrantesAtuais,
                integrante.usuario_projeto_id ? 'usuario_projeto_id' : 'id',
                id,
                nivel,
              )
            }
          />
        ))}

        {integrantesAdicionais.length > 0 && (
          <Text className="mt-2 font-inter-bold text-purple-700">Novos Participantes</Text>
        )}
        {integrantesAdicionais.map((adicional) => (
          <ProjectMember
            key={adicional.id}
            integrante={adicional}
            id={adicional.id}
            adicional
            onClose={() =>
              setIntegrantesAdicionais((prev) => prev.filter((a) => a.id !== adicional.id))
            }
            onNivelAcessoChange={(id, nivel) =>
              atualizarNivelAcesso(setIntegrantesAdicionais, 'id', id, nivel)
            }
          />
        ))}

        {isEdit && pendentes.length > 0 && (
          <View className="mt-4">
            <Text className="mb-2 text-center font-inter-bold text-cinza-500">
              Convites Pendentes
            </Text>
            {pendentes.map((pendente) => (
              <ProjectMember
                key={pendente.convite_id}
                integrante={pendente}
                id={pendente.convite_id!}
                pendente
                onClose={() => {
                  setPendentes((prev) => prev.filter((p) => p.convite_id !== pendente.convite_id))
                  setConvitesExcluidos((prev) => [...prev, pendente.convite_id!])
                }}
                onNivelAcessoChange={(id, nivel) =>
                  atualizarNivelAcesso(setPendentes, 'convite_id', id, nivel)
                }
              />
            ))}
          </View>
        )}
      </View>

      <Button onPress={handleSubmit(submitForm)} className="mt-6 w-full">
        {isEdit ? 'Atualizar Projeto' : 'Criar Projeto'}
      </Button>
    </View>
  )
}
