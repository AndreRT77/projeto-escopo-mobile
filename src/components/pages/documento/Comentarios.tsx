import { STORAGE_KEYS } from '@/constants/storage'
import type { Comentario } from '@/services/escopo-api/comentario'
import * as comentarioService from '@/services/escopo-api/comentario'
import * as registroService from '@/services/escopo-api/registro'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ChevronsLeft, SendHorizontal, X } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, ScrollView, TextInput, TouchableOpacity, View } from 'react-native'

import { Text } from '@/components/ui/Text'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

interface ComentariosProps {
  documentoId: string | number
  onVoltar: () => void
  onErro?: (mensagem: string) => void
}

type UsuarioAtual = {
  id: string | number | null
  nome: string
  cargo: string
  foto: string
}

type ReferenciaComentario = {
  autor: string
  cargo: string
  texto: string
  registroId?: string | number | null
  registroApagado?: boolean
}

type ComentarioPreparado = {
  id: string | number
  parentId: string | number | null
  tipoId: number
  registroReferenciaId: string | number | null
  nome: string
  cargo: string
  data: string
  horario: string
  texto: string
  avatar: string
  foto: string
  resposta: ReferenciaComentario | null
  referencia: ReferenciaComentario | null
}

type RegistroReferencia = {
  apagado: boolean
  titulo: string
}

const PURPLE = '#552BA9'

function pegar(objeto: any, campos: string[], fallback: any = '') {
  for (const campo of campos) {
    const valor = objeto?.[campo]

    if (valor !== undefined && valor !== null && valor !== '') {
      return valor
    }
  }

  return fallback
}

function pegarObjeto(objeto: any, campos: string[]) {
  const valor = pegar(objeto, campos, null)

  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    return valor
  }

  if (typeof valor === 'string') {
    try {
      const json = JSON.parse(valor)

      return json && typeof json === 'object' && !Array.isArray(json) ? json : null
    } catch {
      return null
    }
  }

  return null
}

function textoDoValor(valor: any) {
  if (valor === undefined || valor === null || valor === '') {
    return ''
  }

  if (typeof valor === 'object') {
    return pegar(valor, ['nome', 'titulo', 'descricao', 'label'], '')
  }

  return String(valor)
}

function formatarDataHora(data?: string) {
  const dataObj = data ? new Date(data) : null

  if (!dataObj || Number.isNaN(dataObj.getTime())) {
    return { data: '', horario: '' }
  }

  return {
    data: dataObj.toLocaleDateString('pt-BR'),
    horario: dataObj.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

function iniciais(nome: string) {
  return String(nome || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

async function lerUsuarioAtual(): Promise<UsuarioAtual> {
  try {
    const usuarioString = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER)
    const usuario = usuarioString ? JSON.parse(usuarioString) : {}

    return {
      id: pegar(usuario, ['id', 'usuario_id', 'usuarioId'], null),
      nome: pegar(usuario, ['nome', 'name', 'email'], 'Usuário'),
      cargo: textoDoValor(
        pegar(
          usuario,
          [
            'cargo',
            'perfil',
            'papel',
            'funcao',
            'tipo_usuario',
            'tipoUsuario',
            'nivel_acesso',
            'nivel_acesso_nome',
          ],
          '',
        ),
      ),
      foto: pegar(usuario, ['foto_perfil', 'foto', 'avatar'], ''),
    }
  } catch {
    return { id: null, nome: 'Usuário', cargo: '', foto: '' }
  }
}

function idComentario(comentario: any) {
  return pegar(comentario, ['id', 'comentario_id', 'comentarioId', 'parent_id'], null)
}

function autorIdComentario(comentario: any) {
  return pegar(comentario, ['autor_id', 'criador_id', 'usuario_id', 'user_id'], null)
}

function parentIdComentario(comentario: any) {
  return pegar(
    comentario,
    [
      'parent_id',
      'parentId',
      'comentario_pai_id',
      'comentarioPaiId',
      'comentario_parent_id',
      'comentarioParentId',
      'resposta_para_id',
      'respostaParaId',
    ],
    null,
  )
}

function textoComentario(comentario: any) {
  return pegar(comentario, ['conteudo', 'texto', 'comentario', 'mensagem', 'parent_conteudo'], '')
}

function autorComentario(comentario: any) {
  const usuario = pegarObjeto(comentario, ['usuario', 'criador', 'autor', 'user'])
  const nome = pegar(
    comentario,
    [
      'autor_nome',
      'nome_criador',
      'criador_nome',
      'nome_usuario',
      'usuario_nome',
      'parent_autor_nome',
      'nome',
      'name',
    ],
    pegar(usuario, ['nome', 'name', 'email'], 'Usuário'),
  )
  const cargo =
    textoDoValor(
      pegar(
        comentario,
        [
          'cargo',
          'perfil',
          'papel',
          'funcao',
          'tipo_usuario',
          'tipoUsuario',
          'nivel_acesso',
          'nivel_acesso_nome',
          'autor_cargo',
          'autor_nivel_acesso',
          'autor_nivel_acesso_nome',
          'parent_autor_nivel_acesso',
        ],
        '',
      ),
    ) ||
    textoDoValor(
      pegar(
        usuario,
        [
          'cargo',
          'perfil',
          'papel',
          'funcao',
          'tipo_usuario',
          'tipoUsuario',
          'nivel_acesso',
          'nivel_acesso_nome',
        ],
        '',
      ),
    )

  return {
    nome,
    cargo,
    foto:
      pegar(comentario, ['foto_perfil', 'foto', 'avatar'], '') ||
      pegar(usuario, ['foto_perfil', 'foto', 'avatar'], ''),
  }
}

function tipoComentario(comentario: any) {
  const comentarioTipo = pegarObjeto(comentario, ['comentario_tipo', 'tipo', 'comentarioTipo'])

  return Number(
    pegar(
      comentario,
      ['comentario_tipo_id', 'tipo_comentario_id', 'tipoId', 'tipo_id'],
      pegar(comentarioTipo, ['id', 'comentario_tipo_id', 'tipo_id'], 1),
    ),
  )
}

function referenciaComentario(comentario: any): ReferenciaComentario | null {
  if (!comentario) return null

  const texto = textoComentario(comentario)
  if (!texto) return null

  const autor = autorComentario(comentario)

  return {
    autor: autor.nome,
    cargo: autor.cargo,
    texto,
  }
}

function referenciaRespostaDireta(comentario: any): ReferenciaComentario | null {
  const texto = pegar(
    comentario,
    [
      'parent_texto',
      'parent_conteudo',
      'comentario_pai_texto',
      'comentario_pai_conteudo',
      'resposta_texto',
      'resposta_conteudo',
      'texto_resposta',
      'conteudo_resposta',
      'mensagem_respondida',
    ],
    '',
  )

  if (!texto) return null

  return {
    autor: pegar(
      comentario,
      [
        'parent_nome',
        'parent_autor',
        'comentario_pai_nome',
        'comentario_pai_autor',
        'resposta_nome',
        'resposta_autor',
        'nome_resposta',
      ],
      'Comentário',
    ),
    cargo: pegar(
      comentario,
      [
        'parent_cargo',
        'parent_autor_nivel_acesso',
        'comentario_pai_cargo',
        'cargo_comentario_pai',
        'resposta_cargo',
        'cargo_resposta',
      ],
      '',
    ),
    texto,
  }
}

function adaptarComentario(
  comentario: Comentario,
  comentariosPorId: Map<string, Comentario>,
  usuarioAtual: UsuarioAtual,
  cargosPorComentarioId: Map<string, string>,
  cargosPorAutorId: Map<string, string>,
): ComentarioPreparado {
  const id = idComentario(comentario)
  const autorId = autorIdComentario(comentario)
  const parentId = parentIdComentario(comentario)
  const comentarioPai =
    pegarObjeto(comentario, [
      'parent',
      'comentario_pai',
      'comentarioPai',
      'comentario_parent',
      'comentarioParent',
      'resposta',
      'resposta_para',
      'respostaPara',
      'comentario_respondido',
      'comentarioRespondido',
    ]) || (parentId ? comentariosPorId.get(String(parentId)) : null)
  const autor = autorComentario(comentario)
  const criadoEm = pegar(comentario, ['criado_em', 'created_at', 'data_criacao'])
  const { data, horario } = formatarDataHora(criadoEm)
  const tipoId = tipoComentario(comentario)
  const registroReferenciaId = pegar(
    comentario,
    ['registro_referencia_id', 'registroReferenciaId', 'registro_referencia', 'registro_id'],
    null,
  )
  const registro = pegarObjeto(comentario, ['registro'])
  const cargo =
    autor.cargo ||
    cargosPorComentarioId.get(String(id)) ||
    cargosPorAutorId.get(String(autorId)) ||
    (String(autorId) === String(usuarioAtual?.id) ? usuarioAtual?.cargo : '') ||
    (tipoId === 3 ? 'Registro' : '')
  const tituloRegistro = textoDoValor(
    pegar(
      registro,
      ['registro_titulo', 'titulo', 'nome'],
      pegar(
        comentario,
        ['registro_titulo', 'registroTitulo', 'titulo_registro', 'registro_nome'],
        '',
      ),
    ),
  )
  const registroLinkId = pegar(registro, ['id', 'registro_id', 'registroId'], registroReferenciaId)

  return {
    id,
    parentId,
    tipoId,
    registroReferenciaId,
    nome: autor.nome,
    cargo,
    data,
    horario,
    texto: textoComentario(comentario),
    avatar: iniciais(autor.nome),
    foto: autor.foto,
    resposta:
      tipoId === 2
        ? referenciaComentario(comentarioPai) || referenciaRespostaDireta(comentario)
        : null,
    referencia:
      tipoId === 3
        ? {
            autor: 'Sugestão de Requisito',
            cargo: tituloRegistro || 'Registro apagado',
            texto: '',
            registroId: registroLinkId || null,
            registroApagado: !tituloRegistro,
          }
        : null,
  }
}

function prepararComentarios(comentariosApi: Comentario[], usuarioAtual: UsuarioAtual) {
  const comentarios = Array.isArray(comentariosApi) ? comentariosApi : []
  const comentariosPorId = new Map(
    comentarios.map((comentario) => [String(idComentario(comentario)), comentario]),
  )
  const cargosPorComentarioId = new Map<string, string>()
  const cargosPorAutorId = new Map<string, string>()

  comentarios.forEach((comentario) => {
    const parent = pegarObjeto(comentario, ['parent'])
    const parentId = pegar(parent, ['parent_id'], null)
    const parentAutorId = pegar(parent, ['parent_autor_id'], null)
    const parentCargo = textoDoValor(
      pegar(parent, ['parent_autor_nivel_acesso', 'parent_cargo', 'cargo'], ''),
    )

    if (parentId && parentCargo) {
      cargosPorComentarioId.set(String(parentId), parentCargo)
    }

    if (parentAutorId && parentCargo) {
      cargosPorAutorId.set(String(parentAutorId), parentCargo)
    }
  })

  return comentarios.map((comentario) =>
    adaptarComentario(
      comentario,
      comentariosPorId,
      usuarioAtual,
      cargosPorComentarioId,
      cargosPorAutorId,
    ),
  )
}

async function prepararComentariosComRegistros(
  comentariosApi: Comentario[],
  usuarioAtual: UsuarioAtual,
) {
  const comentarios = prepararComentarios(comentariosApi, usuarioAtual)
  const registrosIds = [
    ...new Set(
      comentarios
        .map((comentario) => comentario.referencia?.registroId)
        .filter(Boolean)
        .map(String),
    ),
  ]

  if (registrosIds.length === 0) {
    return comentarios
  }

  const registros = await Promise.all(
    registrosIds.map(async (registroId) => {
      try {
        const registro = await registroService.obterDetalhesDeUmRegistro(registroId)
        const titulo = textoDoValor(pegar(registro, ['titulo', 'nome', 'registro_titulo'], ''))

        return [registroId, { apagado: false, titulo } satisfies RegistroReferencia] as const
      } catch {
        return [registroId, { apagado: true, titulo: '' } satisfies RegistroReferencia] as const
      }
    }),
  )
  const registrosPorId = new Map<string, RegistroReferencia>(registros)

  return comentarios.map((comentario) => {
    const referencia = comentario.referencia

    if (!referencia?.registroId) {
      return comentario
    }

    const registro = registrosPorId.get(String(referencia.registroId))

    if (!registro) {
      return comentario
    }

    if (registro.apagado) {
      return {
        ...comentario,
        referencia: {
          ...referencia,
          cargo: 'Registro apagado',
          registroApagado: true,
        },
      }
    }

    return {
      ...comentario,
      referencia: {
        ...referencia,
        cargo: registro.titulo || referencia.cargo || 'Registro',
        registroApagado: false,
      },
    }
  })
}

function Avatar({ comentario }: { comentario: Pick<ComentarioPreparado, 'foto' | 'avatar'> }) {
  return (
    <View className="h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-base bg-cinza-200">
      {comentario.foto ? (
        <Image source={{ uri: comentario.foto }} className="h-full w-full" />
      ) : (
        <Text className="font-inter-semibold text-base text-base">{comentario.avatar}</Text>
      )}
    </View>
  )
}

function Referencia({ referencia }: { referencia: ReferenciaComentario }) {
  return (
    <View className="mb-2 rounded-md bg-cinza-200 px-3 py-2">
      <View className="flex-row flex-wrap items-baseline gap-x-2">
        <Text className="text-sm" style={{ color: PURPLE }}>
          {referencia.autor}
        </Text>
        {!!referencia.cargo && (
          <Text className="text-sm text-cinza-400" numberOfLines={1}>
            {referencia.cargo}
          </Text>
        )}
      </View>

      {!!referencia.texto && (
        <Text className="mt-1 text-sm leading-5 text-cinza-700" numberOfLines={3}>
          {referencia.texto}
        </Text>
      )}
    </View>
  )
}

function ComentarioCard({
  comentario,
  onResponder,
}: {
  comentario: ComentarioPreparado
  onResponder: (comentario: ComentarioPreparado) => void
}) {
  const referencia = comentario.resposta || comentario.referencia

  return (
    <View className="mb-5 flex-row items-start gap-3">
      <Avatar comentario={comentario} />

      <View className="min-w-0 flex-1">
        <View className="mb-1 flex-row flex-wrap items-baseline justify-between gap-x-2">
          <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline gap-x-1">
            <Text className="font-inter-semibold text-base" style={{ color: PURPLE }}>
              {comentario.nome}
            </Text>
            {!!comentario.cargo && (
              <Text className="text-sm text-cinza-400" numberOfLines={1}>
                {comentario.cargo}
              </Text>
            )}
          </View>

          {!!(comentario.horario || comentario.data) && (
            <Text className="text-xs text-cinza-400">
              {comentario.horario} · {comentario.data}
            </Text>
          )}
        </View>

        <View className="rounded-[18px] border border-cinza-500 px-3 py-2">
          {referencia && <Referencia referencia={referencia} />}

          <Text className="text-base leading-6 text-black">{comentario.texto}</Text>
        </View>

        <View className="mt-2 flex-row justify-end">
          <TouchableOpacity
            onPress={() => onResponder(comentario)}
            className="rounded border border-cinza-500 px-3 py-1"
          >
            <Text className="text-sm text-cinza-700">Responder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function Comentarios({ documentoId, onVoltar, onErro }: ComentariosProps) {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioAtual>({
    id: null,
    nome: 'Usuário',
    cargo: '',
    foto: '',
  })
  const [comentarios, setComentarios] = useState<ComentarioPreparado[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [texto, setTexto] = useState('')
  const [respostaPara, setRespostaPara] = useState<ComentarioPreparado | null>(null)

  const usuarioAvatar = useMemo(
    () => ({
      avatar: iniciais(usuarioAtual.nome),
      foto: usuarioAtual.foto,
    }),
    [usuarioAtual],
  )

  const carregarComentarios = useCallback(
    async (usuario: UsuarioAtual) => {
      if (!documentoId) {
        setErro('Informe o ID do documento para carregar comentários.')
        setCarregando(false)
        return
      }

      try {
        setCarregando(true)
        setErro('')
        const comentariosApi = await comentarioService.obterComentariosDeUmDocumento(documentoId)
        const comentariosPreparados = await prepararComentariosComRegistros(comentariosApi, usuario)

        setComentarios(comentariosPreparados)
      } catch (error) {
        const mensagem = extractApiErrorMessage(error)
        setErro(mensagem)
        onErro?.(mensagem)
      } finally {
        setCarregando(false)
      }
    },
    [documentoId, onErro],
  )

  useEffect(() => {
    let ativo = true

    async function carregar() {
      const usuario = await lerUsuarioAtual()

      if (!ativo) return

      setUsuarioAtual(usuario)
      await carregarComentarios(usuario)
    }

    carregar()

    return () => {
      ativo = false
    }
  }, [carregarComentarios, documentoId])

  async function enviarComentario() {
    if (!texto.trim() || enviando) return

    try {
      setEnviando(true)
      setErro('')
      await comentarioService.criarComentarioEmUmDocumento(documentoId, {
        conteudo: texto.trim(),
        parent_id: respostaPara?.id ? Number(respostaPara.id) : null,
        registro_referencia_id: null,
        comentario_tipo_id: respostaPara ? 2 : 1,
      })

      setTexto('')
      setRespostaPara(null)
      await carregarComentarios(usuarioAtual)
    } catch (error) {
      const mensagem = extractApiErrorMessage(error)
      setErro(mensagem)
      onErro?.(mensagem)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <View className="flex-1 bg-white px-4 pt-3">
      <View className="mb-3 flex-row items-center">
        <TouchableOpacity onPress={onVoltar} className="h-10 w-10 items-center justify-center">
          <ChevronsLeft size={34} color="#374151" strokeWidth={2.5} />
        </TouchableOpacity>

        <Text className="ml-1 font-inter-bold text-2xl text-cinza-700">Comentários</Text>
      </View>

      {!!erro && <Text className="mb-2 text-sm text-alert">{erro}</Text>}

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-28"
        showsVerticalScrollIndicator={false}
      >
        {carregando ? (
          <Text className="mt-8 text-cinza-500">Carregando comentários...</Text>
        ) : comentarios.length === 0 ? (
          <Text className="mt-8 text-cinza-500">Nenhum comentário encontrado.</Text>
        ) : (
          comentarios.map((comentario) => (
            <ComentarioCard
              key={String(comentario.id)}
              comentario={comentario}
              onResponder={setRespostaPara}
            />
          ))
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-4 right-4 border-t border-cinza-500 bg-white py-3">
        {respostaPara && (
          <View className="mb-2 flex-row items-center justify-between rounded bg-cinza-200 px-3 py-2">
            <Text className="flex-1 text-xs text-cinza-700" numberOfLines={1}>
              Respondendo {respostaPara.nome}: {respostaPara.texto}
            </Text>
            <TouchableOpacity onPress={() => setRespostaPara(null)} className="ml-2">
              <X size={16} color="#374151" />
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-row items-center">
          <Avatar comentario={usuarioAvatar} />

          <View className="ml-2 flex-1 flex-row items-center rounded-xl border border-cinza-500 px-3">
            <TextInput
              value={texto}
              onChangeText={setTexto}
              editable={!enviando}
              maxLength={500}
              placeholder="Escreva seu comentário"
              placeholderTextColor="#6B7280"
              className="min-h-9 flex-1 font-inter text-sm text-black"
            />

            <TouchableOpacity
              onPress={enviarComentario}
              disabled={enviando || texto.trim().length === 0}
              className="h-9 w-9 items-center justify-center disabled:opacity-40"
            >
              <SendHorizontal size={25} color={PURPLE} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}
