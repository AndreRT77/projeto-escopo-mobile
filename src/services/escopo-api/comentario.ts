import { ENV } from '@/constants/env'
import { api } from '@/services/api'

export interface Comentario {
  id: number
  conteudo: string
  criado_em: string
  parent_id: number | null
  registro_referencia: number | string | Record<string, unknown> | null
  registro_referencia_id?: number | string | null
  comentario_tipo_id?: number | string | null
  criador_id?: number
  criador_nome?: string
  nome_criador?: string
  usuario_nome?: string
  foto_perfil?: string | null
  comentario_tipo?:
    | number
    | string
    | {
        id?: number | string
        nome?: string
      }
  [key: string]: unknown
}

export async function obterComentariosDeUmDocumento(
  documentoId: number | string,
): Promise<Comentario[]> {
  const response = await api.get(`${ENV.API_URL}/api/v1/documento/${documentoId}/comentarios`)

  return extrairComentarios(response.data)
}

function extrairComentarios(data: unknown): Comentario[] {
  if (Array.isArray(data)) {
    return data
  }

  if (!data || typeof data !== 'object') {
    return []
  }

  const comentarios: Comentario[] = []

  coletarComentarios(data, comentarios)

  if (comentarios.length === 0) {
    return []
  }

  const vistos = new Set<string>()

  return comentarios
    .filter((comentario, index) => {
      const tipoOrigem = comentario._comentario_tipo_origem ?? ''
      const chave = String(
        `${tipoOrigem}:${
          comentario.id ??
          comentario.comentario_id ??
          comentario.comentarioId ??
          `${comentario.conteudo ?? ''}-${comentario.criado_em ?? ''}-${index}`
        }`,
      )

      if (vistos.has(chave)) {
        return false
      }

      vistos.add(chave)
      return true
    })
    .map(normalizarComentario)
}

function coletarComentarios(data: unknown, destino: Comentario[]) {
  if (!data || typeof data !== 'object') {
    return
  }

  const objeto = data as Record<string, unknown>

  adicionarLista(destino, objeto.comentarios)
  adicionarLista(destino, objeto.comments)
  adicionarLista(destino, objeto.items)
  adicionarLista(destino, objeto.results)
  adicionarLista(destino, objeto.respostas, 2)
  adicionarLista(destino, objeto.replies, 2)
  adicionarLista(destino, objeto.sugestoes, 3)
  adicionarLista(destino, objeto.sugestões, 3)
  adicionarLista(destino, objeto.suggestions, 3)
  adicionarLista(destino, objeto.sugestoes_requisitos, 3)
  adicionarLista(destino, objeto.sugestoesRequisitos, 3)
  adicionarLista(destino, objeto.requirementSuggestions, 3)

  if (Array.isArray(objeto.data)) {
    adicionarLista(destino, objeto.data)
  } else {
    coletarComentarios(objeto.data, destino)
  }

  if (Array.isArray(objeto.result)) {
    adicionarLista(destino, objeto.result)
  } else {
    coletarComentarios(objeto.result, destino)
  }
}

function adicionarLista(destino: Comentario[], valor: unknown, tipoOrigem?: number) {
  if (!Array.isArray(valor)) {
    return
  }

  valor.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return
    }

    destino.push({
      ...(item as Comentario),
      ...(tipoOrigem ? { _comentario_tipo_origem: tipoOrigem } : {}),
    })
  })
}

function normalizarComentario(comentario: Comentario): Comentario {
  const tipo = objetoOuJson(comentario.comentario_tipo)
  const tipoId =
    numeroOuNull(comentario.comentario_tipo_id) ??
    numeroOuNull(comentario.tipo_comentario_id) ??
    numeroOuNull(comentario.tipo_id) ??
    numeroOuNull(tipo?.id) ??
    numeroOuNull(comentario.comentario_tipo)
  const registroReferenciaExplicita =
    comentario.registro_referencia_id ??
    comentario.registroReferenciaId ??
    comentario.registro_referencia ??
    null
  const registroReferenciaGenerica = comentario.registro_id ?? comentario.registroId ?? null
  const registroReferencia =
    registroReferenciaExplicita ?? (tipoId === 3 || !tipoId ? registroReferenciaGenerica : null)
  const registroReferenciaObjeto = objetoOuJson(registroReferencia)
  const registroReferenciaId =
    numeroOuNull(registroReferencia) ??
    numeroOuNull(registroReferenciaObjeto?.id) ??
    numeroOuNull(registroReferenciaObjeto?.registro_id) ??
    numeroOuNull(registroReferenciaObjeto?.registroId)

  return {
    ...comentario,
    ...(tipoId ? { comentario_tipo_id: tipoId } : {}),
    ...(tipoId && !comentario.comentario_tipo
      ? {
          comentario_tipo: {
            id: tipoId,
            nome: tipoId === 3 ? 'sugestao' : tipoId === 2 ? 'resposta' : 'comentario',
          },
        }
      : {}),
    ...(registroReferenciaId ? { registro_referencia_id: registroReferenciaId } : {}),
  }
}

function objetoOuJson(valor: unknown): Record<string, unknown> | null {
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    return valor as Record<string, unknown>
  }

  if (typeof valor !== 'string') {
    return null
  }

  try {
    const json = JSON.parse(valor)

    return json && typeof json === 'object' && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function numeroOuNull(valor: unknown): number | null {
  if (typeof valor === 'number' && Number.isFinite(valor) && valor > 0) {
    return valor
  }

  if (typeof valor === 'string') {
    const numero = Number(valor)

    return Number.isFinite(numero) && numero > 0 ? numero : null
  }

  return null
}

export interface CriarComentario {
  conteudo: string
  parent_id?: number | null
  registro_referencia_id?: number | null
  comentario_tipo_id: number
}

export async function criarComentarioEmUmDocumento(
  documentoId: number | string,
  body: CriarComentario,
): Promise<{ id: number }> {
  const response = await api.post(`${ENV.API_URL}/api/v1/documento/${documentoId}/comentario`, body)

  return response.data
}
