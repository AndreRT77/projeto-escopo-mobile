import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ChevronsLeft, Lightbulb, Plus, Save, X } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import MarkdownRenderer from '@/components/MarkdownRenderer'
import { Loading } from '@/components/ui/Loading'
import { Text } from '@/components/ui/Text'
import { useAlert } from '@/hooks/useAlert'
import * as comentarioService from '@/services/escopo-api/comentario'
import * as documentoService from '@/services/escopo-api/documento'
import * as projetoService from '@/services/escopo-api/projeto'
import * as registroService from '@/services/escopo-api/registro'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

const PURPLE = '#552BA9'

type DocumentoDestino = {
  id: number | string
  titulo: string
  setor: string
}

type DestinoSugestao = {
  id: string
  setor: string
  documentoId: number | string | ''
}

function formatDate(date?: string) {
  if (!date) return '---'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return '---'
  }

  return parsedDate.toLocaleDateString('pt-BR')
}

function pegar(objeto: any, campos: string[], fallback: any = '') {
  for (const campo of campos) {
    const valor = objeto?.[campo]

    if (valor !== undefined && valor !== null && valor !== '') return valor
  }

  return fallback
}

function limparMarkdown(valor: string) {
  return String(valor || '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(^|\s)(#{1,6}|[-*+]|\d+\.)\s+/gm, '$1')
    .replace(/[`*_~>]/g, '')
    .trim()
}

function normalizarDocumentoDestino(documento: any, categoria: any = {}): DocumentoDestino | null {
  const id = pegar(documento, ['id', 'documento_id', 'documentoId'], '')

  if (!id) return null

  return {
    id,
    titulo: String(
      pegar(documento, ['titulo', 'documento', 'nome', 'nome_documento'], 'Documento'),
    ),
    setor: String(
      pegar(
        documento,
        ['setor', 'setor_nome', 'nome_setor', 'categoria', 'categoria_nome'],
        pegar(categoria, ['nome', 'titulo', 'categoria'], 'Web'),
      ),
    ),
  }
}

function documentosDoProjeto(data: documentoService.CategoriasComDocumentos | any | null) {
  const categorias = data?.projeto?.categorias || data?.categorias || []
  const documentos: DocumentoDestino[] = []

  if (Array.isArray(categorias) && categorias.length > 0) {
    categorias.forEach((categoria) => {
      const documentosCategoria = categoria?.documentos || []

      documentosCategoria.forEach((documento: any) => {
        const normalizado = normalizarDocumentoDestino(documento, categoria)

        if (normalizado) documentos.push(normalizado)
      })
    })
  } else if (Array.isArray(data)) {
    data.forEach((documento) => {
      const normalizado = normalizarDocumentoDestino(documento)

      if (normalizado) documentos.push(normalizado)
    })
  } else {
    const documentosDiretos = data?.documentos || []

    documentosDiretos.forEach((documento: any) => {
      const normalizado = normalizarDocumentoDestino(documento)

      if (normalizado) documentos.push(normalizado)
    })
  }

  return [...new Map(documentos.map((documento) => [String(documento.id), documento])).values()]
}

function setoresDisponiveis(documentos: DocumentoDestino[]) {
  const setores = documentos
    .map((documento) => documento.setor)
    .filter(Boolean)
    .filter((setor, index, lista) => lista.indexOf(setor) === index)

  return setores.length > 0 ? setores : ['Web']
}

function documentosDoSetor(documentos: DocumentoDestino[], setor: string) {
  const filtrados = documentos.filter((documento) => documento.setor === setor)

  return filtrados.length > 0 ? filtrados : documentos
}

function criarDestino(documentos: DocumentoDestino[], indice: number, setorPreferido = '') {
  const setores = setoresDisponiveis(documentos)
  const setor = setores.includes(setorPreferido) ? setorPreferido : setores[0]
  const documentosFiltrados = documentosDoSetor(documentos, setor)
  const documento = documentosFiltrados[0] || documentos[0] || null

  return {
    id: `${Date.now()}-${indice}-${Math.random().toString(36).slice(2)}`,
    setor,
    documentoId: documento?.id || '',
  } satisfies DestinoSugestao
}

function projetoDoRegistro(registro: registroService.Registro | null) {
  return pegar(
    registro,
    ['projeto_id', 'projetoId', 'id_projeto', 'project_id'],
    pegar(
      registro?.projeto,
      ['id', 'projeto_id', 'projetoId'],
      pegar((registro as any)?.project, ['id', 'projeto_id', 'projetoId'], ''),
    ),
  )
}

function podeAlterar(nivelAcessoId: number | null, projetoIdentificado: boolean) {
  return !projetoIdentificado || nivelAcessoId === 1 || nivelAcessoId === 2
}

function DestinoSugestaoCard({
  destino,
  indice,
  documentos,
  setores,
  podeRemover,
  enviando,
  onAlterar,
  onRemover,
}: {
  destino: DestinoSugestao
  indice: number
  documentos: DocumentoDestino[]
  setores: string[]
  podeRemover: boolean
  enviando: boolean
  onAlterar: (destinoId: string, alteracoes: Partial<DestinoSugestao>) => void
  onRemover: (destinoId: string) => void
}) {
  const documentosFiltrados = documentosDoSetor(documentos, destino.setor)

  return (
    <View className={`${indice > 0 ? 'border-t border-cinza-300 pt-3' : ''}`}>
      <View className="mb-3 min-h-8 flex-row items-center justify-between gap-3">
        <Text className="font-inter-medium text-lg text-cinza-700">Destino {indice + 1}</Text>
        {podeRemover && (
          <TouchableOpacity
            onPress={() => onRemover(destino.id)}
            disabled={enviando}
            className="h-8 w-8 items-center justify-center disabled:opacity-50"
          >
            <X size={23} color="#111827" strokeWidth={2.2} />
          </TouchableOpacity>
        )}
      </View>

      <View className="mb-5 pl-2">
        <View className="mb-2 flex-row items-center gap-4">
          <Text className="text-base text-black">Setor</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 pr-2">
              {setores.map((setor) => {
                const selecionado = setor === destino.setor

                return (
                  <TouchableOpacity
                    key={`${destino.id}-${setor}`}
                    onPress={() =>
                      onAlterar(destino.id, {
                        setor,
                        documentoId: documentosDoSetor(documentos, setor)[0]?.id || '',
                      })
                    }
                    disabled={enviando}
                    className={`min-h-9 rounded-lg border px-3 py-2 disabled:opacity-50 ${
                      selecionado ? 'border-base bg-roxo-light' : 'border-cinza-400 bg-white'
                    }`}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: selecionado ? PURPLE : '#374151' }}
                      numberOfLines={1}
                    >
                      {setor}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      <Text className="mb-2 text-base text-black">Documento:</Text>
      <View className="max-h-[220px] overflow-hidden rounded-lg border border-black bg-white">
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {documentosFiltrados.length > 0 ? (
            documentosFiltrados.map((documento) => {
              const selecionado = String(documento.id) === String(destino.documentoId)

              return (
                <TouchableOpacity
                  key={`${destino.id}-${documento.id}`}
                  onPress={() => onAlterar(destino.id, { documentoId: documento.id })}
                  disabled={enviando}
                  className={`min-h-10 px-3 py-2 disabled:opacity-50 ${
                    selecionado ? 'bg-roxo-light' : 'bg-white'
                  }`}
                >
                  <Text
                    className={`text-base leading-5 ${selecionado ? 'font-inter-medium' : ''}`}
                    style={{ color: selecionado ? PURPLE : '#000000' }}
                  >
                    {documento.titulo}
                  </Text>
                </TouchableOpacity>
              )
            })
          ) : (
            <Text className="px-3 py-3 text-cinza-500">Nenhum documento disponível.</Text>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

export default function Registro() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { showAlert } = useAlert()

  const registroId = useMemo(() => {
    const id = params.id

    return Array.isArray(id) ? id[0] : id
  }, [params.id])
  const projetoId = useMemo(() => {
    const id = params.projetoId || params.projeto_id

    return Array.isArray(id) ? id[0] : id
  }, [params.projetoId, params.projeto_id])

  const [registro, setRegistro] = useState<registroService.Registro | null>(null)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [documentos, setDocumentos] = useState<DocumentoDestino[]>([])
  const [projetoInferidoId, setProjetoInferidoId] = useState('')
  const [nivelAcessoId, setNivelAcessoId] = useState<number | null>(null)
  const [sugestaoTexto, setSugestaoTexto] = useState('')
  const [destinosSugestao, setDestinosSugestao] = useState<DestinoSugestao[]>([])
  const [selecao, setSelecao] = useState({ start: 0, end: 0 })
  const [selecaoTratada, setSelecaoTratada] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingSuggestion, setSendingSuggestion] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [suggestionTriggerOpen, setSuggestionTriggerOpen] = useState(false)
  const [suggestionOpen, setSuggestionOpen] = useState(false)

  useEffect(() => {
    async function carregarRegistro() {
      if (!registroId) {
        showAlert('Registro inválido.', 'error')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const registroData = await registroService.obterDetalhesDeUmRegistro(registroId)

        setRegistro(registroData)
        setProjetoInferidoId(String(projetoDoRegistro(registroData) || ''))
        setTitulo(registroData.titulo)
        setConteudo(registroData.conteudo || '')
      } catch (error) {
        showAlert(extractApiErrorMessage(error), 'error')
      } finally {
        setLoading(false)
      }
    }

    carregarRegistro()
  }, [registroId, showAlert])

  const projetoAtualId = useMemo(
    () => String(projetoId || projetoInferidoId || projetoDoRegistro(registro) || ''),
    [projetoId, projetoInferidoId, registro],
  )
  const podeAlterarRegistro = podeAlterar(nivelAcessoId, Boolean(projetoAtualId))
  const setoresSugestao = useMemo(() => setoresDisponiveis(documentos), [documentos])

  useEffect(() => {
    let ativo = true

    async function localizarProjeto() {
      if (projetoAtualId || !registroId) return

      try {
        const resposta = await projetoService.getProjects()
        const projetos = Array.isArray(resposta) ? resposta : ((resposta as any)?.projetos ?? [])

        for (const projeto of projetos) {
          try {
            const registros = await registroService.obterRegistrosDeUmProjeto(projeto.id)
            const encontrado = registros.some((item) => String(item.id) === String(registroId))

            if (encontrado) {
              if (ativo) setProjetoInferidoId(String(projeto.id))
              return
            }
          } catch {}
        }
      } catch {}
    }

    localizarProjeto()

    return () => {
      ativo = false
    }
  }, [projetoAtualId, registroId])

  useEffect(() => {
    let ativo = true

    async function carregarNivelAcesso() {
      if (!projetoAtualId) {
        setNivelAcessoId(null)
        return
      }

      try {
        const projeto = await projetoService.obterDetalhesDoProjetoPorId(projetoAtualId)
        const nivel = Number(projeto?.nivel_acesso_id)

        if (ativo) {
          setNivelAcessoId(Number.isFinite(nivel) ? nivel : null)
        }
      } catch {
        if (ativo) {
          setNivelAcessoId(null)
        }
      }
    }

    carregarNivelAcesso()

    return () => {
      ativo = false
    }
  }, [projetoAtualId])

  useEffect(() => {
    if (podeAlterarRegistro) return

    setEditingContent(false)
    setSuggestionOpen(false)
    setSuggestionTriggerOpen(false)
    setSelecaoTratada('')
  }, [podeAlterarRegistro])

  useEffect(() => {
    let ativo = true

    async function carregarDocumentos() {
      if (!projetoAtualId) {
        setDocumentos([])
        setLoadingDocuments(false)
        return
      }

      try {
        setLoadingDocuments(true)
        const data = await documentoService.obterCategoriasComDocumentoDeUmProjeto(projetoAtualId)

        if (ativo) {
          setDocumentos(documentosDoProjeto(data))
        }
      } catch {
        if (ativo) {
          setDocumentos([])
        }
      } finally {
        if (ativo) {
          setLoadingDocuments(false)
        }
      }
    }

    carregarDocumentos()

    return () => {
      ativo = false
    }
  }, [projetoAtualId])

  const trechoSelecionado = useMemo(() => {
    const inicio = Math.min(selecao.start, selecao.end)
    const fim = Math.max(selecao.start, selecao.end)

    return conteudo.slice(inicio, fim).trim()
  }, [conteudo, selecao])

  const mostrarGatilhoSugestao = useCallback((trecho: string) => {
    setSelecaoTratada(trecho)
    setSugestaoTexto(limparMarkdown(trecho))
    setSuggestionTriggerOpen(true)
  }, [])

  const abrirSugestaoComTrecho = useCallback(
    (trecho: string) => {
      setSelecaoTratada(trecho)

      if (!podeAlterarRegistro) {
        showAlert('Seu nível de acesso não permite criar sugestão.', 'error')
        return
      }

      if (!registroId) {
        showAlert('Abra um registro salvo antes de criar uma sugestão.', 'error')
        return
      }

      if (!projetoAtualId || loadingDocuments) {
        showAlert('Carregando documentos do projeto. Tente novamente em instantes.', 'error')
        return
      }

      if (documentos.length === 0) {
        showAlert(
          'Nenhum documento deste projeto está disponível para receber a sugestão.',
          'error',
        )
        return
      }

      if (!trecho.trim()) {
        showAlert('Selecione um trecho do registro para criar a sugestão.', 'error')
        return
      }

      setSugestaoTexto(limparMarkdown(trecho))
      setDestinosSugestao([criarDestino(documentos, 1)])
      setSuggestionTriggerOpen(false)
      setSuggestionOpen(true)
    },
    [documentos, loadingDocuments, podeAlterarRegistro, projetoAtualId, registroId, showAlert],
  )

  useEffect(() => {
    if (
      !podeAlterarRegistro ||
      !editingContent ||
      !trechoSelecionado ||
      trechoSelecionado === selecaoTratada
    ) {
      return undefined
    }

    const timer = setTimeout(() => mostrarGatilhoSugestao(trechoSelecionado), 650)

    return () => clearTimeout(timer)
  }, [
    editingContent,
    mostrarGatilhoSugestao,
    podeAlterarRegistro,
    selecaoTratada,
    trechoSelecionado,
  ])

  async function refreshRegistro() {
    if (!registroId) return

    const registroData = await registroService.obterDetalhesDeUmRegistro(registroId)

    setRegistro(registroData)
    setTitulo(registroData.titulo)
    setConteudo(registroData.conteudo || '')
  }

  async function handleSave() {
    if (!registroId || !registro) return

    if (!podeAlterarRegistro) {
      showAlert('Seu nível de acesso não permite alterar este registro.', 'error')
      return
    }

    const trimmedTitle = titulo.trim()
    const titleChanged = trimmedTitle !== registro.titulo
    const contentChanged = conteudo !== (registro.conteudo || '')

    if (!trimmedTitle) {
      showAlert('O título do registro não pode ficar vazio.', 'error')
      return
    }

    if (!titleChanged && !contentChanged) {
      setEditingContent(false)
      return
    }

    try {
      setSaving(true)

      if (titleChanged) {
        await registroService.atualizarTitulo(registroId, { titulo: trimmedTitle })
      }

      if (contentChanged) {
        await registroService.atualizarConteudo(registroId, { conteudo })
      }

      await refreshRegistro()
      setEditingContent(false)
      showAlert('Registro salvo com sucesso!', 'success')
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  function alterarDestino(destinoId: string, alteracoes: Partial<DestinoSugestao>) {
    setDestinosSugestao((destinos) =>
      destinos.map((destino) =>
        destino.id === destinoId ? { ...destino, ...alteracoes } : destino,
      ),
    )
  }

  function removerDestino(destinoId: string) {
    setDestinosSugestao((destinos) =>
      destinos.length > 1 ? destinos.filter((destino) => destino.id !== destinoId) : destinos,
    )
  }

  function adicionarDestino() {
    setDestinosSugestao((destinos) => [
      ...destinos,
      criarDestino(documentos, destinos.length + 1, destinos[destinos.length - 1]?.setor),
    ])
  }

  function fecharSugestao() {
    if (sendingSuggestion) return

    setSuggestionOpen(false)
  }

  async function enviarSugestao() {
    const texto = sugestaoTexto.trim()
    const registroReferenciaId = Number(registroId)
    const destinosValidos = destinosSugestao.filter((destino) => destino.documentoId)

    if (!podeAlterarRegistro) {
      showAlert('Seu nível de acesso não permite criar sugestão.', 'error')
      return
    }

    if (!texto) {
      showAlert('Digite o texto da sugestão.', 'error')
      return
    }

    if (destinosValidos.length === 0) {
      showAlert('Selecione pelo menos um documento.', 'error')
      return
    }

    if (Number.isNaN(registroReferenciaId)) {
      showAlert('Registro inválido para criar sugestão.', 'error')
      return
    }

    try {
      setSendingSuggestion(true)
      await Promise.all(
        destinosValidos.map((destino) =>
          comentarioService.criarComentarioEmUmDocumento(destino.documentoId, {
            conteudo: texto,
            parent_id: null,
            registro_referencia_id: registroReferenciaId,
            comentario_tipo_id: 3,
          }),
        ),
      )
      setSuggestionOpen(false)
      setSuggestionTriggerOpen(false)
      setSugestaoTexto('')
      setDestinosSugestao([])
      showAlert(
        destinosValidos.length > 1
          ? 'Sugestão enviada para os comentários dos documentos.'
          : 'Sugestão enviada para os comentários do documento.',
        'success',
      )
    } catch (error) {
      showAlert(extractApiErrorMessage(error), 'error')
    } finally {
      setSendingSuggestion(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  if (!registro) {
    return (
      <SafeAreaView className="flex-1 bg-white px-4 pt-4">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 justify-center">
          <ChevronsLeft size={34} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center">
          <Text className="font-inter-bold text-xl text-cinza-700">Registro não encontrado</Text>
        </View>
      </SafeAreaView>
    )
  }

  const hasChanges = titulo.trim() !== registro.titulo || conteudo !== (registro.conteudo || '')
  const ultimaAlteracao = pegar(registro, [
    'ultima_alteracao',
    'ultima_atualizacao',
    'data_atualizacao',
    'atualizado_em',
    'updated_at',
    'modified_at',
    'alterado_em',
    'criado_em',
  ])
  const dataCriacao = pegar(registro, ['data_criacao', 'criado_em', 'created_at', 'criacao'])

  return (
    <SafeAreaView className="flex-1 bg-fundo">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 px-4 pt-3">
          <View className="relative z-10 border-b border-cinza-400 pb-2">
            <View className="mb-2 flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center"
              >
                <ChevronsLeft size={34} color="#111827" strokeWidth={2.5} />
              </TouchableOpacity>

              <TextInput
                value={titulo}
                onChangeText={setTitulo}
                editable={podeAlterarRegistro && !saving}
                className="max-w-[310px] flex-1 rounded border border-transparent px-1 py-0 font-inter-bold text-2xl text-black"
                selectionColor={PURPLE}
              />
            </View>

            <Text className={`text-sm ${hasChanges ? 'text-alert' : 'text-variant'}`}>
              {hasChanges
                ? 'Alterações não salvas!'
                : `Última Alteração: ${formatDate(ultimaAlteracao)}`}
            </Text>
            <Text className="text-sm text-black">Data de criação: {formatDate(dataCriacao)}</Text>
          </View>

          <View className="relative z-0 mt-3 flex-1 rounded-2xl border border-cinza-300 bg-white px-4 py-4">
            {editingContent ? (
              <TextInput
                value={conteudo}
                onChangeText={(valor) => {
                  setConteudo(valor)
                  setSelecaoTratada('')
                  setSuggestionTriggerOpen(false)
                }}
                onSelectionChange={(event) => {
                  const proximaSelecao = event.nativeEvent.selection
                  setSelecao(proximaSelecao)

                  if (proximaSelecao.start === proximaSelecao.end) {
                    setSelecaoTratada('')
                    setSuggestionTriggerOpen(false)
                  }
                }}
                multiline
                textAlignVertical="top"
                editable={podeAlterarRegistro}
                selectionColor={PURPLE}
                placeholder="Este registro ainda não possui conteúdo."
                placeholderTextColor="#6B7280"
                className="flex-1 p-0 font-inter text-base leading-6 text-black"
              />
            ) : (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  if (podeAlterarRegistro) setEditingContent(true)
                }}
                className="flex-1"
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerClassName={hasChanges ? 'pb-20' : ''}
                >
                  <MarkdownRenderer
                    valor={conteudo}
                    emptyMessage="Este registro ainda não possui conteúdo."
                  />
                </ScrollView>
              </TouchableOpacity>
            )}

            {podeAlterarRegistro && hasChanges && (
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="absolute bottom-4 right-3 flex-row items-center gap-2 rounded-lg bg-base px-5 py-3 disabled:opacity-60"
              >
                <Save size={22} color="#FFFFFF" strokeWidth={2} />
                <Text className="font-inter-semibold text-base text-white">
                  {saving ? 'Salvando' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            )}

            {podeAlterarRegistro && suggestionTriggerOpen && !suggestionOpen && (
              <TouchableOpacity
                onPress={() => abrirSugestaoComTrecho(sugestaoTexto || trechoSelecionado)}
                className="absolute bottom-4 left-3 flex-row items-center gap-2 rounded-full border border-base bg-white px-4 py-2 shadow-external"
              >
                <Lightbulb size={19} color={PURPLE} />
                <Text className="font-inter-semibold text-sm" style={{ color: PURPLE }}>
                  Criar sugestão
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={suggestionOpen}
        transparent
        animationType="fade"
        onRequestClose={fecharSugestao}
      >
        <View className="flex-1 justify-center bg-black/25 px-5">
          <View className="max-h-[88%] rounded-[22px] bg-white px-5 py-4">
            <TouchableOpacity
              onPress={fecharSugestao}
              disabled={sendingSuggestion}
              className="mb-3 h-8 w-8 items-center justify-center disabled:opacity-50"
            >
              <ArrowLeft size={26} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>

            <View className="px-1">
              <Text className="font-inter-semibold text-2xl text-black">Criar Sugestão</Text>
              <View className="mt-2 h-[3px] bg-cinza-300" />
            </View>

            <ScrollView
              className="mt-3"
              contentContainerClassName="gap-6 px-1 pb-4"
              showsVerticalScrollIndicator={false}
            >
              <View className="rounded-lg bg-cinza-100 px-3 py-2">
                <Text className="text-xs text-cinza-500">Trecho selecionado</Text>
                <Text className="mt-1 text-sm leading-5 text-cinza-700" numberOfLines={3}>
                  {sugestaoTexto}
                </Text>
              </View>

              {destinosSugestao.map((destino, indice) => (
                <DestinoSugestaoCard
                  key={destino.id}
                  destino={destino}
                  indice={indice}
                  documentos={documentos}
                  setores={setoresSugestao}
                  podeRemover={destinosSugestao.length > 1}
                  enviando={sendingSuggestion}
                  onAlterar={alterarDestino}
                  onRemover={removerDestino}
                />
              ))}

              <View className="items-center pt-1">
                <TouchableOpacity
                  onPress={adicionarDestino}
                  disabled={sendingSuggestion}
                  className="min-h-9 flex-row items-center gap-2 rounded-full border-2 border-base px-4 py-2 disabled:opacity-50"
                >
                  <Plus size={21} color={PURPLE} />
                  <Text className="font-inter-medium text-base text-cinza-700">Novo Destino</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={enviarSugestao}
                disabled={sendingSuggestion}
                className="self-center rounded-lg bg-base px-8 py-3 disabled:opacity-60"
              >
                <Text className="font-inter-semibold text-base text-white">
                  {sendingSuggestion ? 'Enviando...' : 'Enviar'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
