export interface IProcemientoAgendarCita {
  idAgenda: number;
  idCategory: number;
  categoryName?: string;
  requireElements?: boolean;
  associatedExam?: boolean;
  idTypeAttention?: string;
  creatinineRequest: boolean;
  idSpecialties?: number;
  specialtiesName?: string;
  idCharacteristic?: number;
  characteristicName?: string;
  idElement?: number;
  elementName?: string;
  cups?: string;
  internalCode?: string;
  idSpecialCondition?: number;
  specialConditionName?: string;
  idCity: number;
  idAttentionCenter?: number;
  attentionCenterName?: string;
  address: string;
  iconName: string;
  telephoneNumber: string;
  idUSerAction: number;
  userAction: string;
  nephroprotection: boolean;
  idOperatorMin?: number;
  valuesMin?: number;
  idOperatorInter?: number;
  valuesInter1?: number;
  valuesInter2?: number;
  idOperatorMax?: number;
  valuesMax?: number;
  maximumTime?: number;
  observations?: string;
}

export interface IAgenda {
  idAgenda: number;
  idSede: number;
  sede: string;
  particularTime: number;
  characteristicName: string;
  idCharacteristic: number;
  listDisponibilityAppointment: ListDisponibilityAppointment[];
  cups : string | null;
}

export interface ListDisponibilityAppointment {
  desiredDate: Date;
  startTime: string;
  endTime: string;
  available: boolean;
  isSufficient: boolean;
  isFreeAllDay: boolean;
  // no viene el servicio, se agrega luego para agendar y relizar la busqueda del detalle
  idAgenda?: number;
  caracteristicaName?: string;
  idcaracteristica?: number;
  sede?: string;
  duracion?: number;
  checked?: boolean;
  cups: string;
  idSpecialties : number;
  specialtiesName : string
  // no viene el servicio, se agrega luego para agendar y relizar la busqueda del detalle - end
}

export interface IReservar {
  idPatient: number;
  idPatientType: number;
  idSpecialties: number;
  creatinineResultDate: string;
  creatinineResult: string | null;
  meetsRequirements: boolean;
  originEntity?: IRemitido;
  selectedSchedulingTimes: SelectedSchedulingTime[];
  companionPatient?: CompanionPatient;
  statusPayment : string;
  contract:string;
  paymentSede? :boolean;
  attentionCenterHomologate?: string;
  idInstService?:string;
}



export interface IRemitido {
  idOriginEntity: number;
  medicalAuthorization?: string;
  dateAuthorization?: string;
  medicalOrder?: string;
  dateOrder?: string;
  clinicHistory?: string;
  dateHistory?: string;
}

export interface SelectedSchedulingTime {
  idAgenda: number;
  idElement?: number;
  listIdExam?: string;
  idSede?: number;
  idTypeAttention: string;
  desiredDate: Date;
  startTime: string;
  endTime: string;
}

export interface CompanionPatient {
  name: string,
  idIdentificationType: number,
  adress: string,
  telephone: number,
  email: string,
  idRelationShip: number,
  identificationNumber: string
}
export interface ICalculoCreatinina {
  nephroprotection: boolean
  idOperatorMin?: number
  valuesMin?: number
  idOperatorInter?: number
  valuesInter1?: number
  valuesInter2?: number
  idOperatorMax?: number
  valuesMax?: number
  maximumTime?: number
  observations?: string
  specialConditionName? :string
}

export interface IDataGeneral {
  paises: any[]
  departamentos: any[]
  cuidades: any[]
  sedes: any[]
  categorias: any[]
  especialidades: any[]
  caracteristicas: any[]
  elementos: any[]
  condicionesEspeciales: any[]
  tiposAtencion: any[]
  espacios: any[]
};

export interface IGetDataAgendaEspacios {
  idCategory: number
  idSpecialties: number
  idElement: number
  idCity: number
  idDepartment: number
  idCountry: number
  search: string
  elements: boolean
  contractElement:string
}


export interface IExamenesPorElementos {
  idCategory: number
  listIdsExam: string
}
