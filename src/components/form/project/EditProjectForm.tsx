import { Search } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { TouchableOpacity, View } from 'react-native'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { LabelWithTextInput } from '@/components/form/LabelWithTextInput'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { atualizarProjetoData, atualizarProjetoSchema } from '@/schemas/form-projeto.schema'
import * as projetoService from '@/services/escopo-api/projeto'
import * as usuarioService from '@/services/escopo-api/usuario'
import { Integrante, ProjectMember } from '@/components/form/project/ProjectMember'

interface EditProjectFormProps {
  initialData: any
  onSubmit: (data: any) => Promise<void>
  projectId: string
  onError: (message: string) => void
  stopLoading: () => void
}

const formSchema = atualizarProjetoSchema.extend({ email: z.string().optional() })
type FormValues = atualizarProjetoData & { email?: string }

export default function EditProjectForm({
  initialData,
  onSubmit,
  projectId,
  onError,
  stopLoading,
}: EditProjectFormProps) {
  const [integrantesAtuais, setIntegrantesAtuais] = useState<Integrante[]>([])
  const [integrantesAdicionais, setIntegrantesAdicionais] = useState<Integrante[]>([])
  const [pendentes, setPendentes] = useState<Integrante[]>([])
  const [emailError, setEmailError] = useState('')

  // Arrays para rastrear exclusões no backend
  const [integrantesExcluidos, setIntegrantesExcluidos] = useState<(string | number)[]>([])
  const [convitesExcluidos, setConvitesExcluidos] = useState<(string | number)[]>([])

  const { control, handleSubmit, getValues, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { titulo: '', descricao: '', email: '' },
  })

  useEffect(() => {
    if (initialData && projectId) {
      reset({
        titulo: initialData.titulo,
        descricao: initialData.descricao ?? '',
        email: '',
      })
      initListaParticipantes(projectId)
    }
  }, [initialData, projectId])

  async function initListaParticipantes(id: string) {
    try {
      const response = await projetoService.obterParticipantesDeUmProjeto(id)

      const participantesMapeados: Integrante[] = response.participantes.map((p: any) => ({
        id: p.usuario_id,
        usuario_projeto_id: p.usuario_projeto_id,
        nome: p.nome,
        email: p.email,
        fotoPerfil: p.foto_perfil || undefined,
        isOwner: p.usuario_id === initialData?.criador_id,
        nivel_acesso_id: Number(p.nivel_acesso_id),
      }))

      const pendentesMapeados: Integrante[] = response.pendentes.map((p: any) => ({
        id: p.convite_id,
        convite_id: p.convite_id,
        nome: p.nome,
        email: p.email,
        fotoPerfil: p.foto_perfil || undefined,
        nivel_acesso_id: Number(p.nivel_acesso_id),
      }))

      setIntegrantesAtuais(participantesMapeados)
      setPendentes(pendentesMapeados)
    } catch {
      onError('Erro ao carregar membros do projeto.')
    } finally {
      stopLoading()
    }
  }

  async function handleAddIntegrante() {
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
    } catch {
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

  async function submitForm(data: FormValues) {
    const { email, ...dadosLimpos } = data
    await onSubmit({
      ...dadosLimpos,
      integrantesAtuais,
      integrantesExcluidos,
      integrantesAdicionais,
      pendentes,
      convitesExcluidos,
    })
  }

  return (
    <View className="flex-col gap-5 pb-10">
      <LabelWithTextInput
        control={control}
        name="titulo"
        label="Título do Projeto"
        placeholder="Nome do Projeto"
        rules={{ required: 'O título precisa ser preenchido' }}
      />

      <LabelWithTextInput
        control={control}
        name="descricao"
        label="Sobre o projeto"
        placeholder="Insira uma breve descrição"
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
        <TouchableOpacity onPress={handleAddIntegrante} className="absolute bottom-3 right-4 p-1">
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
              if (integrante.usuario_projeto_id) {
                setIntegrantesExcluidos((prev) => [...prev, integrante.usuario_projeto_id!])
              }
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

        {pendentes.length > 0 && (
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
        Atualizar Projeto
      </Button>
    </View>
  )
}
