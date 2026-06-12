import React from 'react'
import { Image, Linking, ScrollView, View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { ENV } from '@/constants/env'

type MarkdownRendererProps = {
  valor?: string | null
  value?: string | null
  emptyMessage?: string
  compact?: boolean
  tone?: 'default' | 'positive' | 'negative'
}

type ListaAtual = {
  tipo: 'ol' | 'ul'
  itens: ListaItem[]
}

type ListaItem = {
  texto: string
  checked?: boolean
}

type BlocoCodigoAtual = {
  marcador: string
  linguagem: string
  linhas: string[]
}

type TabelaAtual = {
  linhas: string[][]
}

function linkSeguro(url: string) {
  return /^(https?:|mailto:|\/)/i.test(url) ? url : ''
}

function uriSeguro(url: string) {
  const destino = String(url || '').trim()

  if (!/^(https?:|file:|data:image\/|\/)/i.test(destino)) {
    return ''
  }

  if (destino.startsWith('/')) {
    return `${ENV.API_URL.replace(/\/$/, '')}${destino}`
  }

  return destino
}

function abrirLink(url: string) {
  const destino = linkSeguro(url)

  if (!destino || destino.startsWith('/')) {
    return
  }

  Linking.openURL(destino)
}

function renderizarInline(texto: string, chaveBase: string, colorClass: string) {
  const partes: React.ReactNode[] = []
  const textoCompleto = String(texto || '')
  const regex =
    /(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|_[^_]+_)/g
  let ultimoIndice = 0
  let indice = 0

  for (const match of textoCompleto.matchAll(regex)) {
    if (match.index > ultimoIndice) {
      partes.push(textoCompleto.slice(ultimoIndice, match.index))
    }

    const trecho = match[0]
    const chave = `${chaveBase}-${indice}`

    if (trecho.startsWith('**') && trecho.endsWith('**')) {
      partes.push(
        <Text key={chave} className={`font-inter-semibold ${colorClass}`}>
          {trecho.slice(2, -2)}
        </Text>,
      )
    } else if (trecho.startsWith('__') && trecho.endsWith('__')) {
      partes.push(
        <Text key={chave} className={`font-inter-semibold ${colorClass}`}>
          {trecho.slice(2, -2)}
        </Text>,
      )
    } else if (trecho.startsWith('~~') && trecho.endsWith('~~')) {
      partes.push(
        <Text key={chave} className="text-cinza-500 line-through">
          {trecho.slice(2, -2)}
        </Text>,
      )
    } else if (trecho.startsWith('*') && trecho.endsWith('*')) {
      partes.push(
        <Text key={chave} className={`italic ${colorClass}`}>
          {trecho.slice(1, -1)}
        </Text>,
      )
    } else if (trecho.startsWith('_') && trecho.endsWith('_')) {
      partes.push(
        <Text key={chave} className={`italic ${colorClass}`}>
          {trecho.slice(1, -1)}
        </Text>,
      )
    } else if (trecho.startsWith('`') && trecho.endsWith('`')) {
      partes.push(
        <Text
          key={chave}
          className="rounded bg-cinza-200 px-1 text-[13px] text-cinza-700"
          style={{ fontFamily: 'monospace' }}
        >
          {trecho.slice(1, -1)}
        </Text>,
      )
    } else if (trecho.startsWith('http')) {
      partes.push(
        <Text
          key={chave}
          className="text-base underline"
          onPress={() => abrirLink(trecho)}
          suppressHighlighting
        >
          {trecho}
        </Text>,
      )
    } else {
      const [, textoLink, url] = trecho.match(/^\[([^\]]+)\]\(([^)]+)\)$/) || []
      const destino = linkSeguro(url || '')

      partes.push(
        <Text
          key={chave}
          className="text-base underline"
          onPress={() => abrirLink(destino)}
          suppressHighlighting
        >
          {textoLink || trecho}
        </Text>,
      )
    }

    ultimoIndice = match.index + trecho.length
    indice += 1
  }

  if (ultimoIndice < textoCompleto.length) {
    partes.push(textoCompleto.slice(ultimoIndice))
  }

  return partes
}

function BlocoCodigo({
  linhas,
  linguagem,
  chave,
  compact,
}: {
  linhas: string[]
  linguagem: string
  chave: string
  compact: boolean
}) {
  return (
    <View key={chave} className={`${compact ? 'mb-3' : 'mb-4'} rounded-lg bg-cinza-700 px-4 py-3`}>
      {!!linguagem && <Text className="mb-2 text-xs uppercase text-cinza-300">{linguagem}</Text>}
      <Text
        className={`${compact ? 'text-xs leading-5' : 'text-[13px] leading-6'} text-white`}
        style={{ fontFamily: 'monospace' }}
      >
        {linhas.join('\n')}
      </Text>
    </View>
  )
}

function Paragrafo({
  texto,
  indice,
  compact,
  colorClass,
}: {
  texto: string
  indice: number
  compact: boolean
  colorClass: string
}) {
  return (
    <Text
      key={`p-${indice}`}
      className={`${compact ? 'mb-2 text-sm leading-5' : 'mb-3 text-base leading-7'} ${colorClass}`}
    >
      {renderizarInline(texto, `p-${indice}`, colorClass)}
    </Text>
  )
}

function ItemLista({
  item,
  index,
  tipo,
  compact,
  colorClass,
}: {
  item: ListaItem
  index: number
  tipo: 'ol' | 'ul'
  compact: boolean
  colorClass: string
}) {
  const marcadorCheckbox = item.checked === undefined ? null : item.checked ? '☑' : '☐'

  return (
    <View key={`${tipo}-${index}`} className="mb-1 flex-row">
      <Text
        className={`${compact ? 'text-sm leading-5' : 'text-base leading-7'} w-7 ${colorClass}`}
      >
        {marcadorCheckbox || (tipo === 'ol' ? `${index + 1}.` : '•')}
      </Text>
      <Text
        className={`${compact ? 'text-sm leading-5' : 'text-base leading-7'} flex-1 ${colorClass}`}
      >
        {renderizarInline(item.texto, `${tipo}-${index}`, colorClass)}
      </Text>
    </View>
  )
}

function ImagemMarkdown({
  alt,
  url,
  chave,
  compact,
}: {
  alt: string
  url: string
  chave: string
  compact: boolean
}) {
  const uri = uriSeguro(url)

  if (!uri) {
    return null
  }

  return (
    <View key={chave} className={compact ? 'mb-3' : 'mb-4'}>
      <Image
        source={{ uri }}
        className="w-full rounded-lg bg-cinza-200"
        style={{ aspectRatio: 16 / 9 }}
        resizeMode="cover"
      />
      {!!alt && <Text className="mt-1 text-xs text-cinza-500">{alt}</Text>}
    </View>
  )
}

function TabelaMarkdown({
  tabela,
  chave,
  compact,
  colorClass,
}: {
  tabela: TabelaAtual
  chave: string
  compact: boolean
  colorClass: string
}) {
  const [cabecalho, ...linhas] = tabela.linhas

  return (
    <ScrollView key={chave} horizontal className={compact ? 'mb-3' : 'mb-4'}>
      <View className="overflow-hidden rounded-lg border border-cinza-300">
        {!!cabecalho && (
          <View className="flex-row bg-cinza-200">
            {cabecalho.map((celula, index) => (
              <Text
                key={`th-${index}`}
                className={`${compact ? 'text-xs' : 'text-sm'} min-w-28 border-r border-cinza-300 px-3 py-2 font-inter-semibold text-cinza-700`}
              >
                {renderizarInline(celula, `${chave}-th-${index}`, 'text-cinza-700')}
              </Text>
            ))}
          </View>
        )}

        {linhas.map((linha, rowIndex) => (
          <View key={`tr-${rowIndex}`} className="flex-row border-t border-cinza-300 bg-white">
            {linha.map((celula, cellIndex) => (
              <Text
                key={`td-${rowIndex}-${cellIndex}`}
                className={`${compact ? 'text-xs' : 'text-sm'} min-w-28 border-r border-cinza-200 px-3 py-2 ${colorClass}`}
              >
                {renderizarInline(celula, `${chave}-td-${rowIndex}-${cellIndex}`, colorClass)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default function MarkdownRenderer({
  valor,
  value,
  emptyMessage = 'Clique para começar a escrever.',
  compact = false,
  tone = 'default',
}: MarkdownRendererProps) {
  const colorClass =
    tone === 'positive' ? 'text-verde' : tone === 'negative' ? 'text-alert' : 'text-black'
  const elementos: React.ReactNode[] = []
  const linhas = String(valor ?? value ?? '').split('\n')
  let listaAtual: ListaAtual | null = null
  let paragrafoAtual: string[] = []
  let blocoCodigo: BlocoCodigoAtual | null = null
  let tabelaAtual: TabelaAtual | null = null

  function celulasTabela(linha: string) {
    return linha
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((celula) => celula.trim())
  }

  function ehSeparadorTabela(linha: string) {
    const celulas = celulasTabela(linha)

    return celulas.length > 1 && celulas.every((celula) => /^:?-{3,}:?$/.test(celula))
  }

  function ehLinhaTabela(linha: string) {
    return linha.includes('|') && !ehSeparadorTabela(linha) && celulasTabela(linha).length > 1
  }

  function fecharParagrafo() {
    if (paragrafoAtual.length === 0) return

    const texto = paragrafoAtual.join('\n')
    elementos.push(
      <Paragrafo
        key={`p-${elementos.length}`}
        texto={texto}
        indice={elementos.length}
        compact={compact}
        colorClass={colorClass}
      />,
    )
    paragrafoAtual = []
  }

  function fecharLista() {
    if (!listaAtual) return

    const lista = listaAtual

    elementos.push(
      <View key={`lista-${elementos.length}`} className={`${compact ? 'mb-3' : 'mb-4'} pl-1`}>
        {lista.itens.map((item, index) => (
          <ItemLista
            key={`${lista.tipo}-${index}`}
            item={item}
            index={index}
            tipo={lista.tipo}
            compact={compact}
            colorClass={colorClass}
          />
        ))}
      </View>,
    )
    listaAtual = null
  }

  function fecharTabela() {
    if (!tabelaAtual) return

    const tabela = tabelaAtual

    elementos.push(
      <TabelaMarkdown
        key={`tabela-${elementos.length}`}
        chave={`tabela-${elementos.length}`}
        tabela={tabela}
        compact={compact}
        colorClass={colorClass}
      />,
    )
    tabelaAtual = null
  }

  function fecharBlocoCodigo() {
    if (!blocoCodigo) return

    const codigo = blocoCodigo

    elementos.push(
      <BlocoCodigo
        key={`codigo-${elementos.length}`}
        chave={`codigo-${elementos.length}`}
        linhas={codigo.linhas}
        linguagem={codigo.linguagem}
        compact={compact}
      />,
    )
    blocoCodigo = null
  }

  for (let index = 0; index < linhas.length; index += 1) {
    const linha = linhas[index]
    const marcadorCodigo = linha.trim().match(/^(`{3,}|'{3,})\s*([\w-]+)?\s*$/)

    if (blocoCodigo) {
      if (marcadorCodigo && marcadorCodigo[1][0] === blocoCodigo.marcador[0]) {
        fecharBlocoCodigo()
        continue
      }

      blocoCodigo.linhas.push(linha)
      continue
    }

    if (marcadorCodigo) {
      fecharParagrafo()
      fecharLista()
      fecharTabela()
      blocoCodigo = {
        marcador: marcadorCodigo[1],
        linguagem: marcadorCodigo[2] || '',
        linhas: [],
      }
      continue
    }

    const textoLimpo = linha.trim()

    if (!textoLimpo) {
      fecharParagrafo()
      fecharLista()
      fecharTabela()
      continue
    }

    const titulo = textoLimpo.match(/^(#{1,6})\s+(.+)$/)
    const itemLista = textoLimpo.match(/^[-*+]\s+(.+)$/)
    const itemOrdenado = textoLimpo.match(/^\d+\.\s+(.+)$/)
    const citacao = textoLimpo.match(/^>\s+(.+)$/)
    const imagem = textoLimpo.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    const divisor = textoLimpo.match(/^(-{3,}|\*{3,}|_{3,})$/)
    const proximaLinha = linhas[index + 1] || ''
    const inicioTabela = ehLinhaTabela(textoLimpo) && ehSeparadorTabela(proximaLinha)

    if (tabelaAtual && ehSeparadorTabela(textoLimpo)) {
      continue
    }

    if (tabelaAtual && ehLinhaTabela(textoLimpo)) {
      tabelaAtual.linhas.push(celulasTabela(textoLimpo))
      continue
    }

    if (inicioTabela) {
      fecharParagrafo()
      fecharLista()
      tabelaAtual = { linhas: [celulasTabela(textoLimpo)] }
      index += 1
      continue
    }

    fecharTabela()

    if (imagem) {
      fecharParagrafo()
      fecharLista()
      elementos.push(
        <ImagemMarkdown
          key={`imagem-${index}`}
          chave={`imagem-${index}`}
          alt={imagem[1]}
          url={imagem[2]}
          compact={compact}
        />,
      )
      continue
    }

    if (divisor) {
      fecharParagrafo()
      fecharLista()
      elementos.push(
        <View
          key={`hr-${index}`}
          className={`${compact ? 'my-2' : 'my-4'} h-px w-full bg-cinza-300`}
        />,
      )
      continue
    }

    if (titulo) {
      fecharParagrafo()
      fecharLista()

      const nivel = titulo[1].length
      const conteudo = renderizarInline(titulo[2], `titulo-${index}`, colorClass)
      const classe =
        nivel === 1
          ? compact
            ? 'mb-2 text-xl leading-6'
            : 'mb-3 text-[28px] leading-9'
          : nivel === 2
            ? compact
              ? 'mb-2 text-lg leading-6'
              : 'mb-3 text-[22px] leading-7'
            : nivel === 3
              ? compact
                ? 'mb-2 text-base leading-6'
                : 'mb-2 text-lg leading-7'
              : compact
                ? 'mb-1 text-sm leading-5'
                : 'mb-2 text-base leading-6'

      elementos.push(
        <Text key={`titulo-${index}`} className={`${classe} font-inter-semibold ${colorClass}`}>
          {conteudo}
        </Text>,
      )
      continue
    }

    if (itemLista || itemOrdenado) {
      fecharParagrafo()

      const tipo = itemOrdenado ? 'ol' : 'ul'

      if ((listaAtual as ListaAtual | null)?.tipo !== tipo) {
        fecharLista()
        listaAtual = { tipo, itens: [] }
      }
      const lista = listaAtual as ListaAtual

      const textoItem = itemOrdenado?.[1] || itemLista?.[1] || ''
      const task = textoItem.match(/^\[( |x|X)\]\s+(.+)$/)

      lista.itens.push({
        texto: task?.[2] || textoItem,
        checked: task ? task[1].toLowerCase() === 'x' : undefined,
      })
      continue
    }

    if (citacao) {
      fecharParagrafo()
      fecharLista()
      elementos.push(
        <View
          key={`quote-${index}`}
          className={`${compact ? 'mb-3' : 'mb-4'} border-l-4 border-base bg-cinza-100 py-2 pl-4 pr-3`}
        >
          <Text
            className={`${compact ? 'text-sm leading-5' : 'text-base leading-6'} text-cinza-700`}
          >
            {renderizarInline(citacao[1], `quote-${index}`, 'text-cinza-700')}
          </Text>
        </View>,
      )
      continue
    }

    fecharLista()
    paragrafoAtual.push(textoLimpo)
  }

  fecharParagrafo()
  fecharLista()
  fecharTabela()
  fecharBlocoCodigo()

  if (elementos.length === 0) {
    return <Text className="text-cinza-500">{emptyMessage}</Text>
  }

  return <View>{elementos}</View>
}
