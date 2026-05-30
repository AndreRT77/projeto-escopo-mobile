import { zodResolver } from '@hookform/resolvers/zod'
import { useLocalSearchParams } from 'expo-router'
import { ChevronDown, ChevronUp, FolderPlus, PenLine, Plus } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { LabelWithTextInput } from '@/components/form/LabelWithTextInput'
import Documentos from '@/components/pages/projeto/Documentos'
import { FormModal } from '@/components/pages/projeto/FormModal'
import Registros from '@/components/pages/projeto/Registros'
import Reunioes from '@/components/pages/projeto/Reunioes'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import {
  CategoriaData,
  GroupedData,
  ReuniaoData,
  categoriaSchema,
  reuniaoSchema,
} from '@/schemas/projeto.schema'
import * as categoriaService from '@/services/escopo-api/categoria'
import * as documentoService from '@/services/escopo-api/documento'
import * as projetoService from '@/services/escopo-api/projeto'
import * as registroService from '@/services/escopo-api/registro'
import * as reuniaoService from '@/services/escopo-api/reuniao'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

export default function ProjectDetails() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { showAlert } = useAlert()

  // Estados de Dados
  const [project, setProject] = useState<projetoService.DetalhesDoProjeto | null>(null)
  const [documentos, setDocumentos] = useState<documentoService.CategoriasComDocumentos | null>(
    null,
  )
  const [registros, setRegistros] = useState<registroService.Registro[]>([])
  const [reunioes, setReunioes] = useState<reuniaoService.Reuniao[]>([])

  // Estados de UI
  const tabs = ['Documentos', 'Registros', 'Reuniões']
  const [currentTab, setCurrentTab] = useState('Documentos')
  const [expand, setExpand] = useState(false)
  const [expandRegister, setExpandRegister] = useState<Record<string, boolean>>({})
  const [expandReuniao, setExpandReuniao] = useState<Record<string, boolean>>({})

  const [openModalCategoria, setOpenModalCategoria] = useState(false)
  const [openModalReuniao, setOpenModalReuniao] = useState(false)

  const {
    control: controlCategoria,
    handleSubmit: handleSubmitCategoria,
    reset: resetCategoria,
  } = useForm<CategoriaData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { titulo: '' },
  })

  const {
    control: controlReuniao,
    handleSubmit: handleSubmitReuniao,
    reset: resetReuniao,
  } = useForm<ReuniaoData>({
    resolver: zodResolver(reuniaoSchema),
    defaultValues: { titulo: '' },
  })

  useEffect(() => {
    async function carregarDadosIniciais() {
      if (!id) return

      try {
        const [dataProjeto, dataDoc, dataReg, dataMeeting] = await Promise.all([
          projetoService.obterDetalhesDoProjetoPorId(id),
          documentoService.obterCategoriasComDocumentoDeUmProjeto(id),
          registroService.obterRegistrosDeUmProjeto(id),
          reuniaoService.obterReunioesDeUmProjeto(id),
        ])

        setProject(dataProjeto)
        setDocumentos(dataDoc)
        setRegistros(dataReg)
        setReunioes(dataMeeting)
      } catch (error) {
        showAlert(extractApiErrorMessage(error), 'error')
      }
    }

    carregarDadosIniciais()
  }, [id])

  async function onSubmitCategoria(data: CategoriaData) {
    if (!id) return

    try {
      await categoriaService.criarCategoria(id, { titulo: data.titulo })
      const dataDoc = await documentoService.obterCategoriasComDocumentoDeUmProjeto(id)

      setDocumentos(dataDoc)
      fecharModalCategoria()
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    }
  }

  async function onSubmitReuniao(data: ReuniaoData) {
    if (!id) return

    try {
      await reuniaoService.criarReuniaoEmUmProjeto(id, { titulo: data.titulo })
      const dataMeeting = await reuniaoService.obterReunioesDeUmProjeto(id)

      setReunioes(dataMeeting)
      fecharModalReuniao()
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    }
  }

  async function handleDeletarCategoria(categoriaId: string | number) {
    if (!id) return

    try {
      await categoriaService.excluirCategoria(categoriaId)
      const dataDoc = await documentoService.obterCategoriasComDocumentoDeUmProjeto(id)
      setDocumentos(dataDoc)
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    }
  }

  function fecharModalCategoria() {
    setOpenModalCategoria(false)
    resetCategoria()
  }

  function fecharModalReuniao() {
    setOpenModalReuniao(false)
    resetReuniao()
  }

  // Agrupamentos
  const formatRegistros = registros.reduce(
    (acc: GroupedData<registroService.Registro>, registro) => {
      const data = new Date(registro.criado_em)
      const ano = data.getFullYear()
      const mes = data.toLocaleDateString('pt-BR', { month: 'long' })
      const mesFormatado = mes.charAt(0).toUpperCase() + mes.slice(1)

      if (!acc[ano]) acc[ano] = {}
      if (!acc[ano][mesFormatado]) acc[ano][mesFormatado] = []
      acc[ano][mesFormatado].push(registro)

      return acc
    },
    {},
  )

  const formatReunioes = reunioes.reduce((acc: GroupedData<reuniaoService.Reuniao>, reuniao) => {
    const data = new Date(reuniao.criado_em)
    const ano = data.getFullYear()
    const mes = data.toLocaleDateString('pt-BR', { month: 'long' })
    const mesFormatado = mes.charAt(0).toUpperCase() + mes.slice(1)

    if (!acc[ano]) acc[ano] = {}
    if (!acc[ano][mesFormatado]) acc[ano][mesFormatado] = []
    acc[ano][mesFormatado].push(reuniao)

    return acc
  }, {})

  const hasAcessoPrivilegiado = project?.nivel_acesso_id === 1 || project?.nivel_acesso_id === 2

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-5">
        {/* Detalhes do projeto */}
        <View className="w-full p-2">
          <View className="flex-row items-center gap-2">
            <Text className="font-inter-bold text-2xl text-cinza-700">{project?.titulo}</Text>
            {project?.nivel_acesso_id === 1 && (
              <TouchableOpacity>
                <PenLine size={20} color="#7E22CE" />
              </TouchableOpacity>
            )}
          </View>

          <View className="mt-3 gap-2">
            <Text className="text-base text-cinza-600">
              Status:{' '}
              <Text className="font-inter-bold">
                {project?.status ? 'Concluído' : 'Em andamento'}
              </Text>
            </Text>

            <View className={expand ? 'gap-2' : 'flex-row items-end justify-between'}>
              <Text
                numberOfLines={expand ? undefined : 2}
                className="flex-1 text-base text-cinza-600"
              >
                Descrição: {project?.descricao}
              </Text>

              {expand ? (
                <View className="mt-2 w-full">
                  <View className="gap-1 rounded-xl border border-cinza-200 bg-white p-3">
                    <Text className="text-sm text-cinza-500">
                      Data de Criação:{' '}
                      {project?.data_criacao
                        ? new Date(project.data_criacao).toLocaleDateString('pt-BR')
                        : '---'}
                    </Text>
                    <Text className="text-sm text-cinza-500">
                      Última Alteração:{' '}
                      {project?.ultima_atualizacao
                        ? new Date(project.ultima_atualizacao).toLocaleDateString('pt-BR')
                        : '---'}
                    </Text>
                    <Text className="text-sm text-cinza-500">
                      Responsável: {project?.nome_responsavel}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setExpand(false)} className="mt-2 self-center">
                    <ChevronUp size={24} color="#7E22CE" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setExpand(true)}>
                  <ChevronDown size={24} color="#7E22CE" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Seções: Documentos, Registros e Reuniões */}
        <View className="mt-6">
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
        </View>

        {currentTab === 'Documentos' && (
          <View className="mt-6 flex-col items-center gap-4 pb-10">
            {hasAcessoPrivilegiado && (
              <Button
                onPress={() => setOpenModalCategoria(true)}
                className="w-full max-w-[200px] flex-row items-center gap-2"
              >
                <FolderPlus size={20} color="#FFFFFF" />
                <Text className="font-inter-bold text-white">Nova Categoria</Text>
              </Button>
            )}

            <Documentos
              documentos={documentos}
              deletarCategoria={handleDeletarCategoria}
              project={project}
            />
          </View>
        )}

        {currentTab === 'Registros' && (
          <View className="mt-6 pb-10">
            {hasAcessoPrivilegiado && (
              <Button className="mb-4 w-full flex-row items-center gap-2">
                <Plus size={20} color="#FFFFFF" />
                <Text className="font-inter-bold text-white">Novo Registro</Text>
              </Button>
            )}

            <Registros
              expandRegister={expandRegister}
              setExpandRegister={setExpandRegister}
              formatRegistros={formatRegistros}
            />
          </View>
        )}

        {currentTab === 'Reuniões' && (
          <View className="mt-6 pb-10">
            {hasAcessoPrivilegiado && (
              <Button
                onPress={() => setOpenModalReuniao(true)}
                className="mb-4 w-full flex-row items-center gap-2"
              >
                <Plus size={20} color="#FFFFFF" />
                <Text className="font-inter-bold text-white">Nova Reunião</Text>
              </Button>
            )}

            <Reunioes
              expandReuniao={expandReuniao}
              setExpandReuniao={setExpandReuniao}
              formatReunioes={formatReunioes}
            />
          </View>
        )}
      </ScrollView>

      <FormModal
        visible={openModalCategoria}
        onClose={fecharModalCategoria}
        title="Adicionar Categoria"
      >
        <View className="mb-6">
          <LabelWithTextInput
            control={controlCategoria}
            name="titulo"
            label="Título da Categoria"
            placeholder="Ex: Contratos"
          />
        </View>
        <Button onPress={handleSubmitCategoria(onSubmitCategoria)} className="w-full">
          Salvar Categoria
        </Button>
      </FormModal>

      <FormModal visible={openModalReuniao} onClose={fecharModalReuniao} title="Nova Reunião">
        <View className="mb-6">
          <LabelWithTextInput
            control={controlReuniao}
            name="titulo"
            label="Título da Reunião"
            placeholder="Ex: Alinhamento de Sprint"
          />
        </View>
        <Button onPress={handleSubmitReuniao(onSubmitReuniao)} className="w-full">
          Salvar Reunião
        </Button>
      </FormModal>
    </SafeAreaView>
  )
}
