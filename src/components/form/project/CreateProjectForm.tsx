import { Search } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { TouchableOpacity, View } from 'react-native'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { LabelWithTextInput } from '@/components/form/LabelWithTextInput'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { criarProjetoData, criarProjetoSchema } from '@/schemas/form-projeto.schema'
import * as usuarioService from '@/services/escopo-api/usuario'
import { Integrante, ProjectMember } from '@/components/form/project/ProjectMember'

interface CreateProjectFormProps {
  onSubmit: (data: any) => Promise<void>
  userEmail: string
  onError: (message: string) => void
  stopLoading: () => void
}

const formSchema = criarProjetoSchema.extend({ email: z.string().optional() })
type FormValues = criarProjetoData & { email?: string }

export default function CreateProjectForm({
  onSubmit,
  userEmail,
  onError,
  stopLoading,
}: CreateProjectFormProps) {
  const [proprietario, setProprietario] = useState<Integrante[]>([])
  const [integrantesAdicionais, setIntegrantesAdicionais] = useState<Integrante[]>([])
  const [emailError, setEmailError] = useState('')

  const { control, handleSubmit, getValues, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { titulo: '', descricao: '', email: '' },
  })

  useEffect(() => {
    async function inserirProprietario() {
      try {
        const usuario = await usuarioService.getUserByEmail(userEmail)
        setProprietario([
          {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            fotoPerfil: usuario.foto_perfil,
            isOwner: true,
            nivel_acesso_id: 1,
          },
        ])
      } catch (error) {
        onError('Ocorreu uma falha na requisição do proprietário')
      } finally {
        stopLoading()
      }
    }
    inserirProprietario()
  }, [userEmail])

  async function handleAddIntegrante() {
    const emailBusca = getValues('email')
    if (!emailBusca?.trim()) {
      setEmailError('Insira um email para realizar a busca.')
      return
    }

    const jaExiste =
      proprietario.some((i) => i.email === emailBusca) ||
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

  async function submitForm(data: FormValues) {
    const { email, ...dadosLimpos } = data
    await onSubmit({
      ...dadosLimpos,
      integrantes: integrantesAdicionais,
    })
  }

  function atualizarNivelAcesso(idValue: string | number, novoNivel: number) {
    setIntegrantesAdicionais((prev) =>
      prev.map((item) => (item.id === idValue ? { ...item, nivel_acesso_id: novoNivel } : item)),
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

        {proprietario.map((integrante) => (
          <ProjectMember
            key={integrante.id}
            integrante={integrante}
            id={integrante.id}
            isOwner
            onClose={() => {}}
            onNivelAcessoChange={() => {}}
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
            onNivelAcessoChange={(id, nivel) => atualizarNivelAcesso(id, nivel)}
          />
        ))}
      </View>

      <Button onPress={handleSubmit(submitForm)} className="mt-6 w-full">
        Criar Projeto
      </Button>
    </View>
  )
}
