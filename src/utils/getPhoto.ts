import { ENV } from '@/constants/env'

export function getPhoto(valor: any) {
  const texto = (v: any) => {
    if (v === undefined || v === null || v === '') return ''
    return typeof v === 'object' ? String(v?.url || v?.uri || '') : String(v)
  }

  const raw = typeof valor === 'object' && valor ? texto(valor) : String(valor || '')
  const v = String(raw || '').trim()
  if (!v) return ''
  if (/^(null|undefined)$/i.test(v)) return ''
  if (/^(https?:|file:|data:image\/)/i.test(v)) return v
  if (v.startsWith('/')) return `${ENV.API_URL.replace(/\/$/, '')}${v}`
  if (/^[A-Za-z0-9+/=]{80,}$/.test(v)) return `data:image/jpeg;base64,${v}`
  return `${ENV.API_URL.replace(/\/$/, '')}/${v.replace(/^\.?\//, '')}`
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
