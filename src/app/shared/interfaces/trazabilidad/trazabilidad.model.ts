export interface trazabilidadModel {
  idUserAction: number
  fullNameUserAction: string
  fecha_creacion: string
  hora: string
  modulo: string
  idModulo: number
  subModulo: string
  idMovimiento: number
  movimiento: string
  idRol: number
  rolName: string
  datos_actuales: any
  datos_actualizados: any
}

export interface dataTrazabilidad {
  datos_actuales: any
  datos_actualizados: any
  modulo: string
  idModulo: number
  subModulo: string
  idMovimiento: number
  movimiento: string
}

//Crear cita para trazabilidad


export interface createSchedulingTrazabilityModel {
  documentNumber: string
  createdDate: string | Date
  createdHour: string
  attentionCenter: number
  nameUserAction: string
  action: number
  appointmentDate: string | Date,
  internalCode_ElementName: string
  idAppointment: number
}

export interface ConsultSchedulingTrazabilityModel {
  documentNumber: string|null
  attentionCenter: number | null
  nameUserAction: string | null
  action: number | null
  internalCode_ElementName: string | null
  createdDateFrom: string | Date
  createdDateTo: string | Date
  pageNumber: number
  pageSize: number
  orderDescending: boolean
}
