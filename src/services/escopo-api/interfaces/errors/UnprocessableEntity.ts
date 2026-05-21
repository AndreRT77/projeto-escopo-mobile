interface CampoErro {
  campo: string
  mensagem: string
}

export interface UnprocessableEntity {
  codigo: number
  status: string
  erros: CampoErro[]
  rota: string
  data_hora: string
}
