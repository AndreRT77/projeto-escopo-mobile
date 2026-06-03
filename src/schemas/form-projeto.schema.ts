export interface Integrante {
  id: string | number
  nome: string
  email: string
  fotoPerfil?: string
  isOwner?: boolean
  nivel_acesso_id: number
  usuario_projeto_id?: string | number
  convite_id?: string | number
}

export interface ProjectFormData {
  titulo: string
  descricao: string
  email: string
  integrantes?: Integrante[]
  integrantesAtuais?: Integrante[]
  integrantesExcluidos?: (string | number)[]
  integrantesAdicionais?: Integrante[]
  pendentes?: Integrante[]
  convitesExcluidos?: (string | number)[]
}
