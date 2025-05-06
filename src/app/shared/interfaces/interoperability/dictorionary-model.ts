
export interface DictionarysByNamePage {
  nameCode: string,
  idEntity: number,
  pageSize: number,
  pageNumber: number
}

export interface ChangeStatusDictionary {
  idEntitie: number,
  active: boolean,
  idUserAction: number
}

export interface Dictionary {
  idDataDictionary: number
  dictionaryCode: string
  dictionaryName: string
  table: boolean
  idListOfTables: number
  tablesId: string
  descriptions: string
  active? : boolean
  fullNameUserAction? : string
  idUserAction? : number | string
}

export interface CreateDictionary {
  idDataDictionary: number
  dictionaryName: string
  dictionaryCode: string
  table: boolean
  idListOfTables: number
  tablesId: string
  descriptions: string
  fullNameUserAction? : string
  idUserAction? : number | string
}

export interface IGetHomologateEntity{
  dictionaryName:string
  code:string
  searchOwn:boolean
  idIntegration:number
}

