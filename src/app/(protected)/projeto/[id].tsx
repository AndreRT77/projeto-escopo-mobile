import { useLocalSearchParams } from 'expo-router'
import { FolderPlus, Plus, X } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ComponentMenu from '@/components/pages/projeto/ComponentMenu'
import DescriptionProject from '@/components/pages/projeto/DescriptionProject'
import Documents from '@/components/pages/projeto/Documents'
import Meeting from '@/components/pages/projeto/Meeting'
import Register from '@/components/pages/projeto/Register'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import * as categoriaService from '@/services/escopo-api/categoria'
import * as documentoService from '@/services/escopo-api/documento'
import * as projetoService from '@/services/escopo-api/projeto'
import * as registroService from '@/services/escopo-api/registro'
import * as reuniaoService from '@/services/escopo-api/reuniao'

export default function ProjectDetails() {
  const { id } = useLocalSearchParams<{ id: string }>()

  // Estados de Dados
  const [project, setProject] = useState<any>(null)
  const [documentos, setDocumentos] = useState<any[]>([])
  const [registros, setRegistros] = useState<registroService.Registro[]>([])
  const [reunioes, setReunioes] = useState<any[]>([])

  // Estados de UI e Controle
  const tabs = ['Documentos', 'Registros', 'Reuniões']
  const [currentTab, setCurrentTab] = useState('Documentos')
  const [expand, setExpand] = useState(false)
  const [expandRegsister, setExpandRegister] = useState({})
  const [expandReuniao, setExpandReuniao] = useState({})

  // Estados dos Modais
  const [openModalCategoria, setOpenModalCategoria] = useState(false)
  const [openModalReuniao, setOpenModalReuniao] = useState(false)
  const [nomeCategoria, setNomeCategoria] = useState('')
  const [nomeReuniao, setNomeReuniao] = useState('')

  useEffect(() => {
    async function carregarProjeto() {
      if (!id) {
        return
      }

      try {
        const data = await projetoService.obterDetalhesDoProjetoPorId(id)
        const dataDoc = await documentoService.obterCategoriasComDocumentoDeUmProjeto(id)

        setProject(data)
        setDocumentos(dataDoc)
      } catch (error) {
        console.error(error)
      }
    }

    carregarProjeto()
  }, [id])

  useEffect(() => {
    async function carregarRegistros() {
      if (!id) {
        return
      }

      try {
        const dataReg = await registroService.obterRegistrosDeUmProjeto(id)
        setRegistros(dataReg)
      } catch (error) {
        console.error(error)
      }
    }

    carregarRegistros()
  }, [id])

  useEffect(() => {
    async function carregarReunioes() {
      if (!id) {
        return
      }

      try {
        const dataMeeting = await reuniaoService.obterReunioesDeUmProjeto(id)
        setReunioes(dataMeeting)
      } catch (error) {
        console.error(error)
      }
    }

    carregarReunioes()
  }, [id])

  async function handleNovaCategoria() {
    try {
      await categoriaService.criarCategoria(id, { titulo: nomeCategoria })
      const dataDoc = await documentoService.obterCategoriasComDocumentoDeUmProjeto(id)

      setDocumentos(dataDoc)
      setNomeCategoria('') // Limpar o input após salvar
      setOpenModalCategoria(false)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleNovaReuniao() {
    try {
      const nameMeeting = { titulo: nomeReuniao }
      await reuniaoService.criarReuniaoEmUmProjeto(id, nameMeeting)
      const dataDoc = await reuniaoService.obterReunioesDeUmProjeto(id)

      setReunioes(dataDoc)
      setNomeReuniao('') // Limpar o input após salvar
      setOpenModalReuniao(false)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleDeletarCategoria(categoriaId: string | number) {
    try {
      await categoriaService.excluirCategoria(categoriaId)
      const dataDoc = await documentoService.obterCategoriasComDocumentoDeUmProjeto(id)
      setDocumentos(dataDoc)
    } catch (error) {
      console.log(error)
    }
  }

  const formatRegistros = registros.reduce((acc: any, registro: any) => {
    const data = new Date(registro.criado_em)
    const ano = data.getFullYear()
    const mes = data.toLocaleDateString('pt-BR', { month: 'long' })
    const mesFormatado = mes.charAt(0).toUpperCase() + mes.slice(1)

    if (!acc[ano]) acc[ano] = {}
    if (!acc[ano][mesFormatado]) acc[ano][mesFormatado] = []
    acc[ano][mesFormatado].push(registro)

    return acc
  }, {})

  const formatReunioes = reunioes.reduce((acc: any, reuniao: any) => {
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
    <SafeAreaView className="flex-1 bg-cinza-100">
      <ScrollView className="flex-1 px-5 py-6">
        <DescriptionProject project={project} expand={expand} setExpand={setExpand} />

        <View className="mt-6">
          <ComponentMenu currentTab={currentTab} setCurrentTab={setCurrentTab} tabs={tabs} />
        </View>

        {/* Aba: Documentos */}
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

            <Documents
              documentos={documentos}
              deletarCategoria={handleDeletarCategoria}
              project={project}
            />
          </View>
        )}

        {/* Aba: Registros */}
        {currentTab === 'Registros' && (
          <View className="mt-6 pb-10">
            {hasAcessoPrivilegiado && (
              <Button className="mb-4 w-full flex-row items-center gap-2">
                <Plus size={20} color="#FFFFFF" />
                <Text className="font-inter-bold text-white">Novo Registro</Text>
              </Button>
            )}

            <Register
              expandRegsister={expandRegsister}
              setExpandRegister={setExpandRegister}
              formatRegistros={formatRegistros}
            />
          </View>
        )}

        {/* Aba: Reuniões */}
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

            <Meeting
              expandReuniao={expandReuniao}
              setExpandReuniao={setExpandReuniao}
              formatReunioes={formatReunioes}
            />
          </View>
        )}
      </ScrollView>

      {/* Modal: Adicionar Categoria */}
      <Modal
        transparent
        visible={openModalCategoria}
        animationType="fade"
        onRequestClose={() => setOpenModalCategoria(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="relative w-full max-w-md rounded-[32px] bg-white p-6 shadow-external">
            <TouchableOpacity
              onPress={() => setOpenModalCategoria(false)}
              className="absolute right-4 top-4 z-10"
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>

            <Text className="mb-6 mt-2 text-center font-inter-bold text-2xl text-cinza-700">
              Adicionar Categoria
            </Text>

            <View className="mb-6">
              <Text className="mb-2 font-inter-bold text-sm text-cinza-700">
                Título da Categoria
              </Text>
              <TextInput
                value={nomeCategoria}
                onChangeText={setNomeCategoria}
                placeholder="Nova Categoria"
                className="w-full rounded-2xl border border-cinza-300 bg-cinza-100 px-4 py-3 text-base text-cinza-700"
              />
            </View>

            <Button onPress={handleNovaCategoria} className="w-full">
              Salvar Categoria
            </Button>
          </View>
        </View>
      </Modal>

      {/* Modal: Nova Reunião */}
      <Modal
        transparent
        visible={openModalReuniao}
        animationType="fade"
        onRequestClose={() => setOpenModalReuniao(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-4">
          <View className="relative w-full max-w-md rounded-[32px] bg-white p-6 shadow-external">
            <TouchableOpacity
              onPress={() => setOpenModalReuniao(false)}
              className="absolute right-4 top-4 z-10"
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>

            <Text className="mb-6 mt-2 text-center font-inter-bold text-2xl text-cinza-700">
              Nova Reunião
            </Text>

            <View className="mb-6">
              <Text className="mb-2 font-inter-bold text-sm text-cinza-700">Título da Reunião</Text>
              <TextInput
                value={nomeReuniao}
                onChangeText={setNomeReuniao}
                placeholder="Nome da reunião"
                className="w-full rounded-2xl border border-cinza-300 bg-cinza-100 px-4 py-3 text-base text-cinza-700"
              />
            </View>

            <Button onPress={handleNovaReuniao} className="w-full">
              Salvar Reunião
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
