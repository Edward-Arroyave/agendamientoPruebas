export interface ElementosResponse {
  ok: boolean;
  message: string;
  data: Elementos[];
}

export interface Elementos {
  idElement: number;
  elementName: string;
  idProcedure: number;
  idCity: number;
  idAttentionCenter: number;
  idCharacteristic: number;
  particularTime: number;
  idSpecialCondition: number;
  observations: string;
  internalCode: string;
  cups: string
  exams: string;
  active: boolean;
  idUserAction: number;
  idUserUpdate: number;
  specialtiesName: string;
  cityName: string;
  attentionCenterName: string;
  characteristicName: string;
  fullNameUserAction: string;
  desactiveExams: boolean;
  listElementContracts?: ListElementContracts[];
  }
export interface ElementosStatus {
  id: number;
  status: boolean;
  idUserAction: number;
}
export interface ListElementContracts {
  idElementContract: number;
  internalCode: string;
  contracts: string;
}
export interface IProcemientoPost {
  idCity: number | null
  search: string | null
  idAttentionCenter: number | null
}

export interface IElementoExamen {
  checked?: boolean;
  countSimilary?: number;
  containAllExam?: boolean;
  idElement: number;
  elementName: string;
  listExamDetail: ListExamDetail[];
}

export interface ListExamDetail {
  idExam: number;
  examName: string;
  cups: string;
  biologicalSex: string;
}

