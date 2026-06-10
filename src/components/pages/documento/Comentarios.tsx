import { STORAGE_KEYS } from '@/constants/storage'
import { ENV } from '@/constants/env'
import type { Comentario } from '@/services/escopo-api/comentario'
import * as comentarioService from '@/services/escopo-api/comentario'
import * as registroService from '@/services/escopo-api/registro'
import * as userService from '@/services/escopo-api/usuario'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Check, ChevronsLeft, Lightbulb, SendHorizontal, X } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { Text } from '@/components/ui/Text'
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage'

interface ComentariosProps {
  documentoId: string | number
  projetoId?: string | number | null
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

type RegistroOpcao = {
  id: number
  titulo: string
}

type ModoComentario = 'comentario' | 'sugestao'

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
    return pegar(valor, ['nome', 'name', 'titulo', 'descricao', 'label'], '')
  }

  return String(valor)
}

function textoNormalizado(valor: any) {
  return textoDoValor(valor)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function temValor(valor: any) {
  return valor !== undefined && valor !== null && valor !== ''
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

function normalizarFoto(valor: any) {
  const foto =
    typeof valor === 'object' && valor !== null
      ? textoDoValor(
          pegar(
            valor,
            ['url', 'uri', 'src', 'path', 'caminho', 'foto_perfil', 'foto', 'avatar', 'base64'],
            '',
          ),
        ).trim()
      : textoDoValor(valor).trim()

  if (!foto) return ''

  if (/^(https?:|file:|data:image\/)/i.test(foto)) {
    return foto
  }

  if (foto.startsWith('/')) {
    return `${ENV.API_URL.replace(/\/$/, '')}${foto}`
  }

  if (/^[A-Za-z0-9+/=]{80,}$/.test(foto)) {
    return `data:image/jpeg;base64,${foto}`
  }

  return foto
}

function numeroPositivoOuNull(valor: unknown) {
  if (typeof valor === 'number' && Number.isFinite(valor) && valor > 0) {
    return valor
  }

  if (typeof valor === 'string') {
    const numero = Number(valor.trim())

    return Number.isFinite(numero) && numero > 0 ? numero : null
  }

  return null
}

function normalizarRegistroOpcao(registro: registroService.Registro): RegistroOpcao | null {
  const id = numeroPositivoOuNull(pegar(registro, ['id'], null))

  if (!id) return null

  return {
    id,
    titulo: textoDoValor(pegar(registro, ['titulo', 'nome', 'registro_titulo'], 'Registro')),
  }
}

async function lerUsuarioAtual(): Promise<UsuarioAtual> {
  try {
    const usuarioString = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER)
    const usuario = usuarioString ? JSON.parse(usuarioString) : {}
    const email = pegar(usuario, ['email'], '')
    const usuarioAtualizado = email
      ? await userService.getUserByEmail(email).catch(() => null)
      : null
    const usuarioFonte = usuarioAtualizado || usuario

    if (usuarioAtualizado) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.AUTH_USER,
        JSON.stringify({
          ...usuario,
          ...usuarioAtualizado,
        }),
      )
    }

    return {
      id: pegar(usuarioFonte, ['id', 'usuario_id', 'usuarioId'], null),
      nome: pegar(usuarioFonte, ['nome', 'name', 'email'], 'Usuário'),
      cargo: textoDoValor(
        pegar(
          usuarioFonte,
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
      foto: normalizarFoto(pegar(usuarioFonte, ['foto_perfil', 'foto', 'avatar'], '')),
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
    foto: normalizarFoto(
      pegar(
        comentario,
        [
          'foto_perfil',
          'foto',
          'avatar',
          'autor_foto_perfil',
          'criador_foto_perfil',
          'usuario_foto_perfil',
          'user_foto_perfil',
          'parent_autor_foto_perfil',
        ],
        '',
      ) || pegar(usuario, ['foto_perfil', 'foto', 'avatar'], ''),
    ),
  }
}

function idTipoComentario(comentario: any, comentarioTipo: any) {
  const tipoBruto = pegar(
    comentario,
    [
      'comentario_tipo_id',
      'tipo_comentario_id',
      'tipoId',
      'tipo_id',
      'comentarioTipoId',
      'comentario_tipo',
    ],
    null,
  )
  const tipoObjeto = comentarioTipo || pegarObjeto(comentario, ['comentario_tipo', 'tipo'])
  const idObjeto = pegar(
    tipoObjeto,
    ['id', 'comentario_tipo_id', 'tipo_comentario_id', 'tipo_id'],
    null,
  )
  const candidatos = [tipoBruto, idObjeto]

  for (const candidato of candidatos) {
    if (typeof candidato === 'number' && Number.isFinite(candidato)) {
      return candidato
    }

    if (typeof candidato === 'string') {
      const numero = Number(candidato)

      if (Number.isFinite(numero) && numero > 0) {
        return numero
      }

      const json = pegarObjeto({ valor: candidato }, ['valor'])
      const numeroJson = Number(
        pegar(json, ['id', 'comentario_tipo_id', 'tipo_comentario_id', 'tipo_id'], null),
      )

      if (Number.isFinite(numeroJson) && numeroJson > 0) {
        return numeroJson
      }
    }
  }

  return null
}

function tipoComentario(comentario: any) {
  const comentarioTipo = pegarObjeto(comentario, ['comentario_tipo', 'tipo', 'comentarioTipo'])
  const comentarioTipoBruto = pegar(comentario, ['comentario_tipo', 'tipo', 'comentarioTipo'], null)
  const nomeTipo = textoNormalizado(
    pegar(
      comentario,
      [
        'comentario_tipo_nome',
        'tipo_comentario_nome',
        'tipo_nome',
        'nome_tipo',
        'comentarioTipoNome',
      ],
      pegar(
        comentarioTipo,
        ['nome', 'name', 'tipo', 'titulo', 'descricao', 'label'],
        comentarioTipoBruto,
      ),
    ),
  )
  const tipoNumerico = idTipoComentario(comentario, comentarioTipo)
  const tipoOrigem = Number(pegar(comentario, ['_comentario_tipo_origem'], null))
  const temTipoComentario = nomeTipo.includes('comentario') || tipoNumerico === 1
  const temTipoResposta = nomeTipo.includes('respost') || tipoNumerico === 2 || tipoOrigem === 2
  const temTipoSugestao = nomeTipo.includes('sugest') || tipoNumerico === 3 || tipoOrigem === 3
  const temReferencia = temRegistroReferenciaComentario(comentario)
  const temReferenciaGenerica = Boolean(registroReferenciaGenericaIdComentario(comentario))

  if (temTipoResposta || temRespostaComentario(comentario)) return 2
  if (temTipoSugestao || temReferencia || (!temTipoComentario && temReferenciaGenerica)) return 3
  if (temTipoComentario) return 1
  if (typeof tipoNumerico === 'number' && Number.isFinite(tipoNumerico) && tipoNumerico > 0) {
    return tipoNumerico
  }

  return 1
}

function temObjetoComentario(comentario: any, campos: string[]) {
  return Boolean(pegarObjeto(comentario, campos))
}

function temRespostaComentario(comentario: any) {
  return Boolean(
    parentIdComentario(comentario) ||
    temObjetoComentario(comentario, [
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
    ]) ||
    pegar(
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
      null,
    ),
  )
}

function temRegistroReferenciaComentario(comentario: any) {
  return Boolean(
    registroReferenciaIdComentario(comentario) ||
    temObjetoComentario(comentario, [
      'registro_referencia',
      'registroReferencia',
      'requisito_referencia',
    ]) ||
    pegar(
      comentario,
      [
        'registro_titulo',
        'registroTitulo',
        'titulo_registro',
        'registro_nome',
        'registroReferenciaTitulo',
        'registro_referencia_titulo',
        'nome_registro',
        'requisito_titulo',
        'requisito_nome',
      ],
      null,
    ),
  )
}

function registroReferenciaIdComentario(comentario: any) {
  const registroReferenciaObjeto = pegarObjeto(comentario, [
    'registro_referencia',
    'registroReferencia',
    'requisito_referencia',
  ])
  const registroReferenciaValor = pegar(
    comentario,
    ['registro_referencia', 'registroReferencia'],
    null,
  )
  const idDireto = pegar(comentario, ['registro_referencia_id', 'registroReferenciaId'], null)

  if (temValor(idDireto)) return idDireto

  if (registroReferenciaObjeto) {
    return pegar(
      registroReferenciaObjeto,
      ['id', 'registro_id', 'registroId', 'requisito_id', 'requisitoId'],
      null,
    )
  }

  return typeof registroReferenciaValor === 'number' || typeof registroReferenciaValor === 'string'
    ? registroReferenciaValor
    : null
}

function registroReferenciaGenericaIdComentario(comentario: any) {
  const registro = pegarObjeto(comentario, ['registro', 'requisito'])

  return pegar(registro, ['id', 'registro_id', 'registroId', 'requisito_id', 'requisitoId'], null)
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

function tituloRegistroComentario(comentario: any, registro: any) {
  return textoDoValor(
    pegar(
      registro,
      [
        'registro_titulo',
        'titulo',
        'nome',
        'name',
        'label',
        'titulo_registro',
        'registro_nome',
        'requisito_titulo',
        'requisito_nome',
      ],
      pegar(
        comentario,
        [
          'registro_titulo',
          'registroTitulo',
          'titulo_registro',
          'registro_nome',
          'registroReferenciaTitulo',
          'registro_referencia_titulo',
          'nome_registro',
          'requisito_titulo',
          'requisito_nome',
        ],
        '',
      ),
    ),
  )
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
  const registroReferenciaId =
    registroReferenciaIdComentario(comentario) ||
    (tipoId === 3 ? registroReferenciaGenericaIdComentario(comentario) : null)
  const registro = pegarObjeto(comentario, [
    'registro',
    'registro_referencia',
    'registroReferencia',
    'requisito',
    'requisito_referencia',
  ])
  const cargo =
    autor.cargo ||
    cargosPorComentarioId.get(String(id)) ||
    cargosPorAutorId.get(String(autorId)) ||
    (String(autorId) === String(usuarioAtual?.id) ? usuarioAtual?.cargo : '') ||
    (tipoId === 3 ? 'Registro' : '')
  const tituloRegistro = tituloRegistroComentario(comentario, registro)
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
            autor: 'Registro sugerido',
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
    <View className="h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-base bg-cinza-200">
      {comentario.foto ? (
        <Image source={{ uri: comentario.foto }} className="h-full w-full" />
      ) : (
        <Text className="font-inter-semibold text-base text-lg">{comentario.avatar}</Text>
      )}
    </View>
  )
}

function Referencia({ referencia }: { referencia: ReferenciaComentario }) {
  return (
    <View className="mb-3 rounded-lg bg-cinza-200 px-4 py-3">
      <View className="flex-row flex-wrap items-baseline gap-x-2 gap-y-1">
        <Text className="font-inter-medium text-base leading-5" style={{ color: PURPLE }}>
          {referencia.autor}
        </Text>
        {!!referencia.cargo && (
          <Text className="min-w-0 flex-1 text-base leading-5 text-cinza-400" numberOfLines={1}>
            {referencia.cargo}
          </Text>
        )}
      </View>

      {!!referencia.texto && (
        <Text className="mt-2 text-base leading-6 text-cinza-700" numberOfLines={3}>
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
  const tipoRotulo =
    comentario.tipoId === 3 ? 'Sugestão' : comentario.tipoId === 2 ? 'Resposta' : ''

  return (
    <View className="mb-10 flex-row items-start gap-4">
      <Avatar comentario={comentario} />

      <View className="min-w-0 flex-1">
        <View className="mb-2 flex-row items-baseline justify-between gap-x-2">
          <View className="min-w-0 flex-1 flex-row flex-wrap items-baseline gap-x-2">
            <Text className="font-inter-bold text-lg leading-6" style={{ color: PURPLE }}>
              {comentario.nome}
            </Text>
            {!!comentario.cargo && (
              <Text
                className="min-w-0 flex-1 font-inter-semibold text-base leading-6 text-cinza-400"
                numberOfLines={1}
              >
                {comentario.cargo}
              </Text>
            )}
            {!!tipoRotulo && (
              <Text className="rounded bg-cinza-200 px-2 py-0.5 text-xs text-cinza-700">
                {tipoRotulo}
              </Text>
            )}
          </View>

          {!!(comentario.horario || comentario.data) && (
            <Text className="shrink-0 text-base text-cinza-400" numberOfLines={1}>
              {comentario.horario} · {comentario.data}
            </Text>
          )}
        </View>

        <View className="rounded-[18px] border border-cinza-500 px-4 py-4">
          {referencia && <Referencia referencia={referencia} />}

          <Text className="text-base leading-6 text-black">{comentario.texto}</Text>
        </View>

        <View className="mt-4 flex-row justify-end">
          <TouchableOpacity
            onPress={() => onResponder(comentario)}
            className="rounded-md border border-cinza-500 px-4 py-2"
          >
            <Text className="text-base text-cinza-700">Responder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function Comentarios({
  documentoId,
  projetoId,
  onVoltar,
  onErro,
}: ComentariosProps) {
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
  const [modoComentario, setModoComentario] = useState<ModoComentario>('comentario')
  const [registros, setRegistros] = useState<RegistroOpcao[]>([])
  const [carregandoRegistros, setCarregandoRegistros] = useState(false)
  const [erroRegistros, setErroRegistros] = useState('')
  const [registroSelecionadoId, setRegistroSelecionadoId] = useState<number | null>(null)
  const [registroManualId, setRegistroManualId] = useState('')

  const usuarioAvatar = useMemo(
    () => ({
      avatar: iniciais(usuarioAtual.nome),
      foto: usuarioAtual.foto,
    }),
    [usuarioAtual],
  )
  const tipoEnvio = respostaPara ? 'resposta' : modoComentario
  const registroReferenciaDigitado = registroManualId.trim()
  const registroReferenciaId =
    registroSelecionadoId || numeroPositivoOuNull(registroReferenciaDigitado)
  const podeEnviar =
    texto.trim().length > 0 &&
    !enviando &&
    (tipoEnvio !== 'sugestao' || Boolean(registroReferenciaId))

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

    async function carregarRegistros() {
      const projetoNormalizado = numeroPositivoOuNull(projetoId)

      if (!projetoNormalizado) {
        setRegistros([])
        setErroRegistros('')
        setCarregandoRegistros(false)
        return
      }

      try {
        setCarregandoRegistros(true)
        setErroRegistros('')

        const registrosApi = await registroService.obterRegistrosDeUmProjeto(projetoNormalizado)

        if (!ativo) return

        setRegistros(registrosApi.map(normalizarRegistroOpcao).filter(Boolean) as RegistroOpcao[])
      } catch (error) {
        if (!ativo) return

        setRegistros([])
        setErroRegistros(extractApiErrorMessage(error))
      } finally {
        if (ativo) {
          setCarregandoRegistros(false)
        }
      }
    }

    carregarRegistros()

    return () => {
      ativo = false
    }
  }, [projetoId])

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

  function alternarSugestao() {
    if (respostaPara) return

    setModoComentario((modoAtual) => (modoAtual === 'sugestao' ? 'comentario' : 'sugestao'))
    setErro('')
  }

  function responderComentario(comentario: ComentarioPreparado) {
    setRespostaPara(comentario)
    setModoComentario('comentario')
    setErro('')
  }

  function cancelarSugestao() {
    setModoComentario('comentario')
    setRegistroSelecionadoId(null)
    setRegistroManualId('')
    setErro('')
  }

  async function enviarComentario() {
    if (!texto.trim() || enviando) return

    const conteudo = texto.trim()
    const comentarioTipoId = respostaPara ? 2 : modoComentario === 'sugestao' ? 3 : 1
    const parentId = comentarioTipoId === 2 ? numeroPositivoOuNull(respostaPara?.id) : null
    const referenciaId =
      comentarioTipoId === 3
        ? registroSelecionadoId || numeroPositivoOuNull(registroManualId)
        : null

    if (comentarioTipoId === 2 && !parentId) {
      setErro('Selecione um comentário válido para responder.')
      return
    }

    if (comentarioTipoId === 3 && !referenciaId) {
      setErro('Selecione ou informe o ID de um registro para criar a sugestão.')
      return
    }

    try {
      setEnviando(true)
      setErro('')
      await comentarioService.criarComentarioEmUmDocumento(documentoId, {
        conteudo,
        parent_id: parentId,
        registro_referencia_id: referenciaId,
        comentario_tipo_id: comentarioTipoId,
      })

      setTexto('')
      setRespostaPara(null)
      setModoComentario('comentario')
      setRegistroSelecionadoId(null)
      setRegistroManualId('')
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
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 px-4 pt-3">
        <View className="mb-4 flex-row items-center border-b border-cinza-200 pb-3">
          <TouchableOpacity onPress={onVoltar} className="h-10 w-10 items-center justify-center">
            <ChevronsLeft size={34} color="#374151" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text className="ml-1 font-inter-bold text-2xl text-cinza-700">Comentários</Text>
        </View>

        {!!erro && <Text className="mb-2 text-sm text-alert">{erro}</Text>}

        <ScrollView
          className="flex-1"
          contentContainerClassName={
            tipoEnvio === 'sugestao' ? 'pb-52' : respostaPara ? 'pb-40' : 'pb-32'
          }
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
                onResponder={responderComentario}
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

          {tipoEnvio === 'sugestao' && (
            <View className="mb-2 rounded bg-cinza-200 px-3 py-2">
              <View className="flex-row items-center">
                <Text className="mr-2 text-xs text-cinza-700">Sugestão para registro</Text>

                <TextInput
                  value={registroManualId}
                  onChangeText={(valor) => {
                    setRegistroManualId(valor)
                    setRegistroSelecionadoId(null)
                  }}
                  editable={!enviando}
                  keyboardType="number-pad"
                  placeholder="ID"
                  placeholderTextColor="#6B7280"
                  className="h-8 w-20 rounded border border-cinza-300 bg-white px-2 font-inter text-xs text-black"
                />

                <View className="ml-auto flex-row items-center gap-2">
                  {carregandoRegistros && <ActivityIndicator size="small" color={PURPLE} />}
                  <TouchableOpacity onPress={cancelarSugestao}>
                    <X size={16} color="#374151" />
                  </TouchableOpacity>
                </View>
              </View>

              {registros.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                  <View className="flex-row gap-2 pr-2">
                    {registros.map((registro) => {
                      const selecionado = registroSelecionadoId === registro.id

                      return (
                        <TouchableOpacity
                          key={registro.id}
                          onPress={() => {
                            setRegistroSelecionadoId(selecionado ? null : registro.id)
                            setRegistroManualId('')
                          }}
                          className={`max-w-40 flex-row items-center gap-1 rounded-full border px-2 py-1 ${
                            selecionado ? 'border-base bg-white' : 'border-cinza-300'
                          }`}
                        >
                          {selecionado && <Check size={12} color={PURPLE} />}
                          <Text className="text-xs text-cinza-700" numberOfLines={1}>
                            {registro.titulo}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </ScrollView>
              )}

              {!!erroRegistros && (
                <Text className="mt-1 text-xs text-cinza-500">{erroRegistros}</Text>
              )}
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
                placeholder={
                  respostaPara
                    ? 'Escreva sua resposta'
                    : modoComentario === 'sugestao'
                      ? 'Descreva a sugestão'
                      : 'Escreva seu comentário'
                }
                placeholderTextColor="#6B7280"
                className="max-h-24 min-h-9 flex-1 py-2 font-inter text-sm text-black"
                multiline
              />

              {!respostaPara && (
                <TouchableOpacity
                  onPress={alternarSugestao}
                  disabled={enviando}
                  className="h-9 w-9 items-center justify-center disabled:opacity-40"
                >
                  <Lightbulb size={22} color={modoComentario === 'sugestao' ? PURPLE : '#6B7280'} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={enviarComentario}
                disabled={!podeEnviar}
                className="h-9 w-9 items-center justify-center disabled:opacity-40"
              >
                <SendHorizontal size={25} color={PURPLE} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
