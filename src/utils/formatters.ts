export function formatDate(data: string) {
  return new Date(data).toLocaleDateString('pt-BR')
}
