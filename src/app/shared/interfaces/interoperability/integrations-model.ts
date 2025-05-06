
export interface IntegrationsByNamePage {
  nameCode: string
  pageSize: number
  pageNumber: number
  idEntity: number
}

export interface ChangeStatusIntegration {
  idIntegration: number,
  active: boolean,
  idUserAction: number
}

export interface Integration {
  idIntegrations: number,
  integrationsCode: string,
  integrationsName: string
  active? : boolean
  fullNameUserAction? : string
  idUserAction? : number | string
}
