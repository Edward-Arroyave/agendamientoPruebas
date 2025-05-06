export interface ConsultAdminEspacio{
  idElement?: number;
  idSpecialties? :number;
  idOriginEntity? :number;
  idCity: number;
  idTypeAttention: number;
  desiredDate?: string | Date;
  haveExams: boolean ;
  idCountry: number ;
  idCharacteristic? : number
}
