
export interface HomologationsByNamePage {
  nameCodeSearch: string
  idIntegration: number
  idDataDictionary: number
  idHomologation: number
  pageSize: number,
  pageNumber: number
}

export interface ChangeStatusHomologation {
  idEntitie: number,
  active: boolean,
  idUserAction: number
}

export interface Homologation{

    idHomologation: number,
    ownCode: string,
    externalCode: string,
    active: boolean,
    idIntegrations: number,
    integrationsName: string,
    dictionaryName: string,
    idDataDictionary: number,
    descriptions: string
    idUserAction?: number,
    fullNameUserAction?: string,

}


