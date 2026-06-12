import { ENV } from '@/constants/env'

export function getPhoto(valor: any) {
  const texto = (v: any) => {
    if (v === undefined || v === null || v === '') return ''
    return typeof v === 'object'
      ? String(
          v?.url ||
            v?.uri ||
            v?.src ||
            v?.path ||
            v?.foto_perfil ||
            v?.fotoPerfil ||
            v?.foto ||
            v?.avatar ||
            v?.base64 ||
            '',
        )
      : String(v)
  }

  const raw = typeof valor === 'object' && valor ? texto(valor) : String(valor || '')
  const v = String(raw || '').trim()
  if (!v) return ''
  if (/^(null|undefined|none|sem[-_\s]?foto|no[-_\s]?photo|default)$/i.test(v)) return ''
  if (/^(file:|data:image\/)/i.test(v)) return v
  if (/^https?:/i.test(v)) return normalizarHostLocal(v)
  if (v.startsWith('/')) return `${ENV.API_URL.replace(/\/$/, '')}${v}`
  if (/^[A-Za-z0-9+/=]{80,}$/.test(v)) return `data:image/jpeg;base64,${v}`

  const caminho = v.replace(/^\.?\//, '')
  if (!pareceCaminhoDeImagem(caminho)) return ''

  return `${ENV.API_URL.replace(/\/$/, '')}/${caminho}`
}

function pareceCaminhoDeImagem(valor: string) {
  return /[\\/]/.test(valor) || /\.(png|jpe?g|webp|gif|bmp|heic|heif)(\?.*)?$/i.test(valor)
}

function normalizarHostLocal(valor: string) {
  try {
    const url = new URL(valor)
    const api = new URL(ENV.API_URL)
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname)) {
      url.protocol = api.protocol
      url.hostname = api.hostname
      url.port = api.port
    }
    return url.toString()
  } catch {
    return valor
  }
}

export function initials(nome: string) {
  return String(nome || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}
