import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { ChevronsLeft, SendHorizontal, X } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { Text } from '@/components/ui/Text'
import { STORAGE_KEYS } from '@/constants/storage'
import type { Comentario } from '@/services/escopo-api/comentario'
import * as comentarioService from '@/services/escopo-api/comentario'
import * as registroService from '@/services/escopo-api/registro'
import * as userService from '@/services/escopo-api/usuario'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'
import { getPhoto, initials } from '@/utils/getPhoto'

type Props = {
  documentoId: string | number
  projetoId?: string | number | null
  onVoltar: () => void
  onErro?: (mensagem: string) => void
}

type Usuario = { id: string | number | null; nome: string; nivel: string; foto: string | number }
type Ref = {
  autor: string
  nivel: string
  texto?: string
  registroId?: string | number | null
  apagado?: boolean
}
type Item = {
  id: string | number
  tipo: number
  nome: string
  nivel: string
  foto: string | number
  avatar: string
  texto: string
  data: string
  hora: string
  ordem: number
  parentId: string | number | null
  registroId: string | number | null
  resposta?: Ref | null
  referencia?: Ref | null
}

const PURPLE = '#552BA9'
const VARIANT = '#7645D787'
const REFERENCE_BG = '#E5E7EB'
const DEFAULT_AVATAR = require('@/assets/images/icons/user-default.jpg') as ImageSourcePropType
const campos = (valor: string) => valor.split(' ')
const perfilCampos = campos(
  'nivel_acesso nivel_acesso_nome nivelAcesso cargo perfil papel funcao tipo_usuario',
)
const fotoCampos = campos(
  'foto_perfil fotoPerfil foto avatar foto_usuario fotoUsuario usuario_foto usuarioFoto autor_foto autorFoto autor_foto_perfil autorFotoPerfil criador_foto criadorFoto criador_foto_perfil criadorFotoPerfil usuario_foto_perfil',
)
const emailCampos = campos('email e_mail usuario_email autor_email criador_email user_email')
const nomeCampos = campos(
  'autor_nome nome_criador criador_nome nome_usuario usuario_nome parent_autor_nome nome name',
)
const idUsuarioCampos = campos(
  'autor_id autorId criador_id criadorId usuario_id usuarioId id_usuario user_id userId usuario_projeto_id usuarioProjetoId integrante_id participante_id id',
)
const autorObjetoCampos = campos(
  'usuario criador autor user usuario_criador usuarioCriador criador_usuario criadorUsuario',
)
const usuarioObjetoCampos = campos('usuario user')
const comentarioTextoCampos = campos('conteudo texto comentario mensagem')
const dataCampos = campos('criado_em created_at data_criacao')
const tipoCampos = campos('comentario_tipo_id tipo_comentario_id tipoId tipo_id')
const registroObjCampos = campos('registro registro_referencia registroReferencia requisito')
const registroIdCampos = campos(
  'registro_referencia_id registroReferenciaId registro_referencia registro_id registroId',
)
const parentObjetoCampos = campos(
  'parent comentario_pai comentarioPai comentario_parent comentarioParent resposta_para respostaPara comentario_respondido comentarioRespondido resposta',
)
const parentIdCampos = campos(
  'parent_id parentId comentario_pai_id comentarioPaiId comentario_parent_id comentarioParentId resposta_para_id respostaParaId comentario_respondido_id comentarioRespondidoId',
)
const parentTextoCampos = campos(
  'parent_texto parent_text parent_conteudo parent_mensagem comentario_pai_texto comentario_pai_conteudo comentarioPaiTexto comentarioPaiConteudo comentario_parent_texto comentarioParentTexto comentario_respondido_texto comentarioRespondidoTexto resposta_para_texto respostaParaTexto resposta_para_conteudo respostaParaConteudo resposta_texto resposta_conteudo resposta_mensagem texto_resposta conteudo_resposta mensagem_respondida',
)
const parentAutorCampos = campos(
  'parent_autor_nome parent_autor parent_nome parent_name comentario_pai_autor comentario_pai_nome comentarioPaiAutor comentarioPaiNome comentario_parent_autor comentarioParentAutor comentario_respondido_autor comentarioRespondidoAutor resposta_para_autor respostaParaAutor resposta_autor resposta_nome nome_resposta',
)
const parentNivelCampos = campos(
  'parent_cargo parent_autor_nivel_acesso parent_nivel_acesso comentario_pai_cargo comentarioPaiCargo cargo_comentario_pai comentario_parent_cargo comentario_respondido_cargo resposta_para_cargo respostaParaCargo resposta_cargo cargo_resposta',
)

function get(objeto: any, campos: string[], fallback: any = '') {
  for (const campo of campos) {
    const valor = objeto?.[campo]
    if (valor !== undefined && valor !== null && valor !== '') return valor
  }
  return fallback
}

function getAny(fontes: any[], campos: string[], fallback: any = '') {
  for (const fonte of fontes) {
    const valor = get(fonte, campos, null)
    if (valor !== undefined && valor !== null && valor !== '') return valor
  }
  return fallback
}

function getFoto(fontes: any[]) {
  for (const fonte of fontes) {
    for (const campo of fotoCampos) {
      const foto = getPhoto(fonte?.[campo])
      if (foto) return foto
    }
  }
  return ''
}

function obj(objeto: any, campos: string[]) {
  const valor = get(objeto, campos, null)
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) return valor
  if (typeof valor !== 'string') return null
  try {
    const json = JSON.parse(valor)
    return json && typeof json === 'object' && !Array.isArray(json) ? json : null
  } catch {
    return null
  }
}

function texto(valor: any) {
  if (valor === undefined || valor === null || valor === '') return ''
  return typeof valor === 'object'
    ? get(valor, ['nome', 'name', 'titulo', 'descricao', 'label'], '')
    : String(valor)
}

function numero(valor: any) {
  const n = Number(typeof valor === 'string' ? valor.trim() : valor)
  return Number.isFinite(n) && n > 0 ? n : null
}

function dataHora(data?: string) {
  const d = data ? new Date(data) : null
  if (!d || Number.isNaN(d.getTime())) return { data: '', hora: '', ordem: 0 }
  return {
    data: d.toLocaleDateString('pt-BR'),
    hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    ordem: d.getTime(),
  }
}

function limparMarkdown(valor: string) {
  return String(valor || '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(^|\s)(#{1,6}|[-*+]|\d+\.)\s+/gm, '$1')
    .replace(/[`*_~>]/g, '')
    .trim()
}

async function usuarioAtual(): Promise<Usuario> {
  try {
    const salvo = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER)) || '{}')
    const atualizado = salvo.email
      ? await userService.getUserByEmail(salvo.email).catch(() => null)
      : null
    const u = atualizado || salvo
    return {
      id: get(u, idUsuarioCampos, null),
      nome: get(u, ['nome', 'name', 'email'], 'Usuário'),
      nivel: texto(get(u, perfilCampos, '')),
      foto: getFoto([u]),
    }
  } catch {
    return { id: null, nome: 'Usuário', nivel: '', foto: '' }
  }
}

function usuarioRelacionado(objeto: any) {
  return obj(objeto, usuarioObjetoCampos)
}

const comentarioId = (c: any) => get(c, ['id', 'comentario_id', 'comentarioId', 'parent_id'], '')
const autorObj = (c: any) => obj(c, autorObjetoCampos)
const autorId = (c: any) =>
  getAny([c, autorObj(c), usuarioRelacionado(autorObj(c))], idUsuarioCampos, null)
const parentId = (c: any) => get(c, parentIdCampos, null)

function registroId(c: any) {
  const reg = obj(c, registroObjCampos)
  return get(c, registroIdCampos, null) || get(reg, ['id', 'registro_id', 'registroId'], null)
}

function autor(c: any) {
  const u = autorObj(c)
  const fontes = [c, u, usuarioRelacionado(u)]
  return {
    nome: getAny(fontes, nomeCampos, getAny(fontes, emailCampos, 'Usuário')),
    nivel: texto(getAny(fontes, perfilCampos, '')),
    foto: getFoto(fontes),
  }
}

function tipoComentario(c: any) {
  const tipoObj = obj(c, ['comentario_tipo', 'tipo'])
  const tipo = numero(get(c, tipoCampos, get(tipoObj, ['id'], null)))
  if (parentId(c) || obj(c, parentObjetoCampos) || refRespostaDireta(c)) return 2
  if (tipo === 3 || registroId(c)) return 3
  return tipo || 1
}

function refResposta(c: any): Ref | null {
  const conteudo = texto(get(c, [...comentarioTextoCampos, 'parent_conteudo'], ''))
  if (!c || !conteudo) return null
  const a = autor(c)
  return { autor: a.nome, nivel: a.nivel, texto: conteudo }
}

function refRespostaDireta(c: any): Ref | null {
  const conteudo = texto(get(c, parentTextoCampos, ''))
  if (!conteudo) return null
  return {
    autor: get(c, parentAutorCampos, 'Comentário'),
    nivel: texto(get(c, parentNivelCampos, '')),
    texto: conteudo,
  }
}

async function preparar(raw: Comentario[], user: Usuario) {
  const porId = new Map(raw.map((c) => [String(comentarioId(c)), c]))
  const base = raw.map((c) => {
    const id = comentarioId(c)
    const aid = autorId(c)
    const a = autor(c)
    const me = aid != null && user.id != null && String(aid) === String(user.id)
    const tipo = tipoComentario(c)
    const rid = registroId(c)
    const pid = parentId(c)
    const parent = obj(c, parentObjetoCampos) || porId.get(String(pid))
    const dh = dataHora(texto(get(c, dataCampos, '')))

    return {
      id,
      tipo,
      nome: a.nome,
      nivel: a.nivel || (me ? user.nivel : '') || (tipo === 3 ? 'Registro' : ''),
      foto: a.foto || (me ? user.foto : '') || '',
      avatar: initials(a.nome),
      texto: texto(get(c, comentarioTextoCampos, '')),
      parentId: pid,
      registroId: rid,
      resposta: tipo === 2 ? refResposta(parent) || refRespostaDireta(c) : null,
      referencia: rid
        ? ({
            autor: 'Sugestão de Requisito',
            nivel: 'Registro apagado',
            registroId: rid,
            apagado: true,
          } as Ref)
        : null,
      ...dh,
    } satisfies Item
  })
  const porItemId = new Map(base.map((c) => [String(c.id), c]))
  const comRespostas = base.map((c) => {
    if (c.tipo !== 2 || c.resposta) return c

    const original = c.parentId ? porItemId.get(String(c.parentId)) : null

    return {
      ...c,
      resposta: original
        ? {
            autor: original.nome,
            nivel: original.nivel,
            texto: original.texto,
          }
        : c.parentId
          ? {
              autor: 'Resposta para comentário',
              nivel: `#${c.parentId}`,
              texto: 'Comentário original não encontrado.',
            }
          : null,
    }
  })
  const ids = [
    ...new Set(
      comRespostas
        .map((c) => c.registroId)
        .filter(Boolean)
        .map(String),
    ),
  ]
  const titulos = new Map<string, string>()
  await Promise.all(
    ids.map(async (id) => {
      try {
        const reg = await registroService.obterDetalhesDeUmRegistro(id)
        titulos.set(id, texto(get(reg, ['titulo', 'nome'], 'Registro')))
      } catch {}
    }),
  )

  return comRespostas
    .map((c) =>
      c.referencia && c.registroId
        ? {
            ...c,
            referencia: {
              ...c.referencia,
              nivel: titulos.get(String(c.registroId)) || 'Registro apagado',
              apagado: !titulos.has(String(c.registroId)),
            },
          }
        : c,
    )
    .sort((a, b) => a.ordem - b.ordem || Number(a.id) - Number(b.id))
}

function Avatar({ item }: { item: Pick<Item, 'avatar' | 'foto'> }) {
  const [erroFoto, setErroFoto] = useState(false)
  const fotoKey = typeof item.foto === 'string' ? item.foto.trim() : String(item.foto || '')
  const fotoSource: ImageSourcePropType | null =
    typeof item.foto === 'string' ? (fotoKey ? { uri: fotoKey } : null) : item.foto || null
  const source = fotoSource && !erroFoto ? fotoSource : DEFAULT_AVATAR

  useEffect(() => {
    setErroFoto(false)
  }, [fotoKey])

  return (
    <View className="h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-base bg-cinza-200">
      <Image
        key={fotoKey || 'default-avatar'}
        source={source}
        className="h-full w-full"
        resizeMode="cover"
        onError={() => {
          if (fotoSource) setErroFoto(true)
        }}
      />
    </View>
  )
}

function Referencia({ refItem, interativa = false }: { refItem: Ref; interativa?: boolean }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const clicavel = interativa && !!refItem.registroId && !refItem.apagado
  const backgroundColor = clicavel && (hovered || pressed) ? VARIANT : REFERENCE_BG
  const conteudo = (
    <>
      <View className="flex-row flex-wrap items-baseline gap-x-2 gap-y-1">
        <Text className="font-inter-medium text-base leading-5" style={{ color: PURPLE }}>
          {refItem.autor}
        </Text>
        {!!refItem.nivel && (
          <Text className="min-w-0 flex-1 text-base leading-5 text-cinza-400" numberOfLines={1}>
            {refItem.nivel}
          </Text>
        )}
      </View>
      {!!refItem.texto && (
        <Text className="mt-3 text-base leading-6 text-cinza-700" numberOfLines={3}>
          {limparMarkdown(refItem.texto)}
        </Text>
      )}
    </>
  )
  const cls = 'mb-3 rounded-lg px-5 py-3'
  if (clicavel) {
    return (
      <Pressable
        className={cls}
        style={{ backgroundColor }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={() => router.push(`/registro/${refItem.registroId}` as any)}
      >
        {conteudo}
      </Pressable>
    )
  }
  return (
    <View className={cls} style={{ backgroundColor }}>
      {conteudo}
    </View>
  )
}

function Card({ item, onResponder }: { item: Item; onResponder: (item: Item) => void }) {
  return (
    <View className="mb-8 flex-row items-start gap-3">
      <Avatar item={item} />
      <View className="min-w-0 flex-1">
        <View className="mb-1 flex-row flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline gap-x-2">
            <Text className="font-inter-semibold text-base leading-6" style={{ color: PURPLE }}>
              {item.nome}
            </Text>
            {!!item.nivel && (
              <Text
                className="min-w-0 flex-1 font-inter-semibold text-base leading-6 text-cinza-400"
                numberOfLines={1}
              >
                {item.nivel}
              </Text>
            )}
          </View>
          {!!(item.hora || item.data) && (
            <Text className="text-sm text-cinza-400" numberOfLines={1}>
              {item.hora} · {item.data}
            </Text>
          )}
        </View>
        <View className="rounded-[18px] border border-cinza-500 px-4 py-4">
          {item.resposta && <Referencia refItem={item.resposta} />}
          {item.referencia && <Referencia refItem={item.referencia} interativa />}
          <Text className="text-base leading-6 text-black">{limparMarkdown(item.texto)}</Text>
        </View>
        <View className="mt-3 flex-row justify-end">
          <TouchableOpacity
            onPress={() => onResponder(item)}
            className="rounded border border-cinza-500 px-4 py-2"
          >
            <Text className="text-base text-cinza-700">Responder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function Comentarios({ documentoId, onVoltar, onErro }: Props) {
  const scrollRef = useRef<ScrollView>(null)
  const [user, setUser] = useState<Usuario>({ id: null, nome: 'Usuário', nivel: '', foto: '' })
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [erro, setErro] = useState('')
  const [textoInput, setTextoInput] = useState('')
  const [resposta, setResposta] = useState<Item | null>(null)
  const avatar = useMemo(() => ({ avatar: initials(user.nome), foto: user.foto }), [user])
  const scrollFim = useCallback((animated = false) => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated }))
  }, [])

  const carregar = useCallback(
    async (u: Usuario) => {
      try {
        setLoading(true)
        setErro('')
        const comentarios = await comentarioService.obterComentariosDeUmDocumento(documentoId)
        setUser(u)
        setItems(await preparar(comentarios, u))
      } catch (error) {
        const msg = extractApiErrorMessage(error)
        setErro(msg)
        onErro?.(msg)
      } finally {
        setLoading(false)
      }
    },
    [documentoId, onErro],
  )

  useEffect(() => {
    let alive = true
    usuarioAtual().then((u) => {
      if (!alive) return
      setUser(u)
      carregar(u)
    })
    return () => {
      alive = false
    }
  }, [carregar])

  useEffect(() => {
    if (!loading) scrollFim()
  }, [items.length, loading, scrollFim])

  async function enviar() {
    const conteudo = textoInput.trim()
    if (!conteudo || sending) return
    const pid = resposta ? numero(resposta.id) : null
    if (resposta && !pid) {
      setErro('Selecione um comentário válido para responder.')
      return
    }
    try {
      setSending(true)
      setErro('')
      await comentarioService.criarComentarioEmUmDocumento(documentoId, {
        conteudo,
        parent_id: pid,
        registro_referencia_id: null,
        comentario_tipo_id: resposta ? 2 : 1,
      })
      setTextoInput('')
      setResposta(null)
      await carregar(user)
    } catch (error) {
      const msg = extractApiErrorMessage(error)
      setErro(msg)
      onErro?.(msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1">
        <View className="min-h-[58px] flex-row items-center gap-1 border-b border-cinza-200 px-5 py-3">
          <TouchableOpacity onPress={onVoltar} className="h-10 w-10 items-center justify-center">
            <ChevronsLeft size={34} color="#374151" strokeWidth={3} />
          </TouchableOpacity>
          <Text className="font-inter-bold text-[26px] text-cinza-700">Comentários</Text>
        </View>

        {!!erro && <Text className="px-4 py-2 text-sm text-alert">{erro}</Text>}

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerClassName="pb-32 pt-6"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollFim()}
          onLayout={() => scrollFim()}
        >
          {loading ? (
            <Text className="text-cinza-500">Carregando comentários...</Text>
          ) : items.length === 0 ? (
            <Text className="text-cinza-500">Nenhum comentário encontrado.</Text>
          ) : (
            items.map((item) => (
              <Card key={String(item.id)} item={item} onResponder={setResposta} />
            ))
          )}
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-cinza-700 bg-white px-4 py-3">
          {resposta && (
            <View className="mb-2 flex-row items-center justify-between rounded bg-cinza-200 px-3 py-2">
              <Text className="flex-1 text-xs text-cinza-700" numberOfLines={1}>
                Respondendo {resposta.nome}: {resposta.texto}
              </Text>
              <TouchableOpacity onPress={() => setResposta(null)} className="ml-2">
                <X size={16} color="#374151" />
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-row items-center gap-3">
            <Avatar item={avatar} />
            <View className="h-12 flex-1 flex-row items-center rounded-xl border border-cinza-600 px-4">
              <TextInput
                value={textoInput}
                onChangeText={setTextoInput}
                editable={!sending}
                maxLength={500}
                placeholder={resposta ? 'Escreva sua resposta' : 'Escreva seu comentário'}
                placeholderTextColor="#6B7280"
                className="flex-1 font-inter text-base text-black"
              />
              <TouchableOpacity
                onPress={enviar}
                disabled={sending || !textoInput.trim()}
                className="pl-3 disabled:opacity-40"
              >
                <SendHorizontal size={28} color="#B79BE8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
