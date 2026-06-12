import { Text } from '@/components/ui/Text'
import * as documentoService from '@/services/escopo-api/documento'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'
import { GitCompare, RotateCcw, X } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

const PURPLE = '#552BA9'

type DiffPart = {
  texto: string
  tipo: 'igual' | 'novo' | 'removido'
}

type DiffLineOp = {
  linha: string
  tipo: DiffPart['tipo']
}

interface VersionamentoProps {
  versoes: documentoService.VersaoMin[]
  titulo: string
  onFechar: () => void
  onErro?: (mensagem: string) => void
}

function formatarData(data?: string) {
  if (!data) return ''

  const dataObj = new Date(data)

  if (Number.isNaN(dataObj.getTime())) {
    return ''
  }

  return dataObj.toLocaleDateString('pt-BR')
}

function nomeDaVersao(index: number, total: number) {
  return `V${total - index}`
}

function idDaVersao(versao: documentoService.VersaoMin | documentoService.DetalhesVersao) {
  return String(versao?.id ?? '')
}

function timestampDaVersao(versao: documentoService.VersaoMin | documentoService.DetalhesVersao) {
  const timestamp = new Date(versao?.criado_em || '').getTime()

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function ordenarVersoesPorData<T extends documentoService.DetalhesVersao>(versoesParaOrdenar: T[]) {
  return [...versoesParaOrdenar].sort((a, b) => timestampDaVersao(b) - timestampDaVersao(a))
}

function linhasDoConteudo(conteudo: string) {
  const normalizado = String(conteudo || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

  return normalizado ? normalizado.split('\n') : []
}

function adicionarParte(partes: DiffPart[], texto: string | undefined, tipo: DiffPart['tipo']) {
  if (!texto) return

  const ultimaParte = partes[partes.length - 1]

  if (ultimaParte?.tipo === tipo) {
    ultimaParte.texto += texto
    return
  }

  partes.push({ texto, tipo })
}

function adicionarLinhas(partes: DiffPart[], linhas: string[], tipo: DiffPart['tipo']) {
  if (!linhas.length) return
  adicionarParte(partes, linhas.map((linha) => `${linha}\n`).join(''), tipo)
}

function operacoesDiffLinhas(antigas: string[], novas: string[]) {
  const dp = Array.from({ length: antigas.length + 1 }, () => Array(novas.length + 1).fill(0))
  const operacoes: DiffLineOp[] = []

  for (let antigoIndex = antigas.length - 1; antigoIndex >= 0; antigoIndex -= 1) {
    for (let novoIndex = novas.length - 1; novoIndex >= 0; novoIndex -= 1) {
      dp[antigoIndex][novoIndex] =
        antigas[antigoIndex] === novas[novoIndex]
          ? dp[antigoIndex + 1][novoIndex + 1] + 1
          : Math.max(dp[antigoIndex + 1][novoIndex], dp[antigoIndex][novoIndex + 1])
    }
  }

  let antigoIndex = 0
  let novoIndex = 0

  while (antigoIndex < antigas.length && novoIndex < novas.length) {
    if (antigas[antigoIndex] === novas[novoIndex]) {
      operacoes.push({ linha: antigas[antigoIndex], tipo: 'igual' })
      antigoIndex += 1
      novoIndex += 1
    } else if (dp[antigoIndex + 1][novoIndex] >= dp[antigoIndex][novoIndex + 1]) {
      operacoes.push({ linha: antigas[antigoIndex], tipo: 'removido' })
      antigoIndex += 1
    } else {
      operacoes.push({ linha: novas[novoIndex], tipo: 'novo' })
      novoIndex += 1
    }
  }

  while (antigoIndex < antigas.length) {
    operacoes.push({ linha: antigas[antigoIndex], tipo: 'removido' })
    antigoIndex += 1
  }

  while (novoIndex < novas.length) {
    operacoes.push({ linha: novas[novoIndex], tipo: 'novo' })
    novoIndex += 1
  }

  return operacoes
}

function compararConteudos(conteudoAntigo: string, conteudoNovo: string) {
  const antigas = linhasDoConteudo(conteudoAntigo)
  const novas = linhasDoConteudo(conteudoNovo)
  const antigo: DiffPart[] = []
  const novo: DiffPart[] = []

  let inicioIgual = 0
  const menorTamanho = Math.min(antigas.length, novas.length)

  while (inicioIgual < menorTamanho && antigas[inicioIgual] === novas[inicioIgual]) {
    inicioIgual += 1
  }

  let fimAntigo = antigas.length - 1
  let fimNovo = novas.length - 1

  while (
    fimAntigo >= inicioIgual &&
    fimNovo >= inicioIgual &&
    antigas[fimAntigo] === novas[fimNovo]
  ) {
    fimAntigo -= 1
    fimNovo -= 1
  }

  adicionarLinhas(antigo, antigas.slice(0, inicioIgual), 'igual')
  adicionarLinhas(novo, novas.slice(0, inicioIgual), 'igual')

  const meioAntigo = antigas.slice(inicioIgual, fimAntigo + 1)
  const meioNovo = novas.slice(inicioIgual, fimNovo + 1)

  operacoesDiffLinhas(meioAntigo, meioNovo).forEach((operacao) => {
    if (operacao.tipo === 'igual') {
      adicionarLinhas(antigo, [operacao.linha], 'igual')
      adicionarLinhas(novo, [operacao.linha], 'igual')
      return
    }

    if (operacao.tipo === 'removido') {
      adicionarLinhas(antigo, [operacao.linha], 'removido')
      return
    }

    adicionarLinhas(novo, [operacao.linha], 'novo')
  })

  adicionarLinhas(antigo, antigas.slice(fimAntigo + 1), 'igual')
  adicionarLinhas(novo, novas.slice(fimNovo + 1), 'igual')

  return { antigo, novo }
}

function TextoDiff({ partes }: { partes: DiffPart[] }) {
  return (
    <Text className="text-xs leading-4">
      {partes.map((parte, index) => (
        <Text
          key={`${parte.tipo}-${index}`}
          className={
            parte.tipo === 'novo'
              ? 'text-verde'
              : parte.tipo === 'removido'
                ? 'text-alert'
                : 'text-black'
          }
        >
          {parte.texto}
        </Text>
      ))}
    </Text>
  )
}

export function Versionamento({ versoes, titulo, onFechar, onErro }: VersionamentoProps) {
  const [modo, setModo] = useState<'historico' | 'comparacao'>('historico')
  const [versoesComparadas, setVersoesComparadas] = useState<
    (documentoService.DetalhesVersao & { nome: string })[]
  >([])
  const [versoesSelecionadasIds, setVersoesSelecionadasIds] = useState<string[]>([])

  const versoesOrdenadas = useMemo(
    () =>
      [...versoes].sort(
        (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
      ),
    [versoes],
  )

  const diffComparacao = useMemo(() => {
    if (versoesComparadas.length < 2) {
      return { antigo: [] as DiffPart[], novo: [] as DiffPart[] }
    }

    return compararConteudos(versoesComparadas[1]?.conteudo, versoesComparadas[0]?.conteudo)
  }, [versoesComparadas])

  useEffect(() => {
    setModo('historico')
    setVersoesComparadas([])
    setVersoesSelecionadasIds(versoesOrdenadas[0] ? [idDaVersao(versoesOrdenadas[0])] : [])
  }, [versoesOrdenadas])

  async function buscarVersaoCompleta(
    versao: documentoService.VersaoMin,
    index: number,
  ): Promise<documentoService.DetalhesVersao & { nome: string }> {
    const versaoDetalhada = await documentoService.obterDetalhesDeUmaVersao(versao.id)

    return {
      ...versao,
      ...versaoDetalhada,
      id: versaoDetalhada?.id || versao.id,
      titulo: versaoDetalhada?.titulo || titulo,
      conteudo: versaoDetalhada?.conteudo || '',
      criado_em: versaoDetalhada?.criado_em || versao.criado_em,
      nome: index >= 0 ? nomeDaVersao(index, versoesOrdenadas.length) : 'Versão',
    }
  }

  async function abrirComparacao(ids: string[]) {
    const idsUnicos = [...new Set(ids)].filter(Boolean)

    if (idsUnicos.length !== 2) return

    try {
      onErro?.('')
      const resumos = idsUnicos
        .map((id) => versoesOrdenadas.find((versao) => idDaVersao(versao) === id))
        .filter(Boolean) as documentoService.VersaoMin[]

      const detalhes = await Promise.all(
        resumos.map((resumo) => {
          const index = versoesOrdenadas.findIndex(
            (versao) => idDaVersao(versao) === idDaVersao(resumo),
          )

          return buscarVersaoCompleta(resumo, index)
        }),
      )

      setVersoesComparadas(ordenarVersoesPorData(detalhes))
      setModo('comparacao')
    } catch (error) {
      onErro?.(extractApiErrorMessage(error))
    }
  }

  async function selecionarVersao(versao: documentoService.VersaoMin) {
    const id = idDaVersao(versao)
    const jaSelecionada = versoesSelecionadasIds.includes(id)

    if (jaSelecionada) {
      setVersoesSelecionadasIds((ids) => ids.filter((item) => item !== id))
      return
    }

    const proximasSelecoes =
      versoesSelecionadasIds.length >= 2 ? [id] : [...versoesSelecionadasIds, id]

    setVersoesSelecionadasIds(proximasSelecoes)

    if (proximasSelecoes.length === 2) {
      await abrirComparacao(proximasSelecoes)
    }
  }

  return (
    <View className="absolute inset-0 z-20 bg-black/20 px-4">
      {modo === 'historico' ? (
        <View
          className="mt-24 rounded-2xl border border-base bg-white px-5 pb-4 pt-3"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="mb-3 flex-row items-center justify-center">
            <Text className="font-inter-semibold text-lg text-black">Comparar Versões</Text>
            <TouchableOpacity
              onPress={onFechar}
              className="absolute right-0 h-8 w-8 items-center justify-center"
            >
              <X size={28} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView className="max-h-[360px]" showsVerticalScrollIndicator={false}>
            {versoesOrdenadas.length === 0 ? (
              <Text className="text-sm text-cinza-500">Nenhuma versão encontrada.</Text>
            ) : (
              <View className="gap-3">
                {versoesOrdenadas.map((versao, index) => {
                  const id = idDaVersao(versao)
                  const selecionada = versoesSelecionadasIds.includes(id)

                  return (
                    <TouchableOpacity
                      key={versao.id}
                      onPress={() => selecionarVersao(versao)}
                      className="flex-row items-start justify-between gap-3"
                    >
                      <Text
                        className="min-w-0 flex-1 text-sm"
                        style={{ color: selecionada ? PURPLE : '#4B5563' }}
                      >
                        {titulo} - {nomeDaVersao(index, versoesOrdenadas.length)} -{' '}
                        {formatarData(versao.criado_em)}
                      </Text>

                      {selecionada ? (
                        <X size={20} color="#374151" />
                      ) : (
                        <GitCompare size={20} color={PURPLE} />
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        <View
          className="my-auto max-h-[86%] rounded-lg border border-base bg-white px-5 pb-6 pt-4"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 9,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {versoesComparadas[0] && (
              <View>
                <Text className="mb-4 text-center text-base" style={{ color: PURPLE }}>
                  {versoesComparadas[0].titulo} - {versoesComparadas[0].nome} -{' '}
                  {formatarData(versoesComparadas[0].criado_em)}
                </Text>
                <View className="max-h-60 rounded-xl border border-cinza-400 p-2">
                  <ScrollView nestedScrollEnabled>
                    <TextoDiff partes={diffComparacao.novo} />
                  </ScrollView>
                </View>
              </View>
            )}

            {versoesComparadas[1] && (
              <View className="mt-8">
                <Text className="mb-4 text-center text-base" style={{ color: PURPLE }}>
                  {versoesComparadas[1].titulo} - {versoesComparadas[1].nome} -{' '}
                  {formatarData(versoesComparadas[1].criado_em)}
                </Text>
                <View className="max-h-60 rounded-xl border border-cinza-400 p-2">
                  <ScrollView nestedScrollEnabled>
                    <TextoDiff partes={diffComparacao.antigo} />
                  </ScrollView>
                </View>
              </View>
            )}
          </ScrollView>

          <View className="mt-5 flex-row justify-center">
            <TouchableOpacity
              onPress={() => setModo('historico')}
              className="flex-row items-center gap-2 rounded-lg border border-cinza-300 px-5 py-3"
            >
              <Text className="font-inter-medium text-base" style={{ color: PURPLE }}>
                Voltar
              </Text>
              <RotateCcw size={22} color={PURPLE} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

export default Versionamento
