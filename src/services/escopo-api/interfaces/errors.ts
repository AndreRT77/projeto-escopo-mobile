export interface DefaultBodyError {
  codigo: number
  status: string
  mensagem: string
  rota: string
  data_hora: string
}

interface CampoErro {
  campo: string
  mensagem: string
}

export interface UnprocessableEntityError {
  codigo: number
  status: string
  erros: CampoErro[]
  rota: string
  data_hora: string
}
