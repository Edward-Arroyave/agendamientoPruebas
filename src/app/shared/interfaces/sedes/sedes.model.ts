export interface Sede{
  idAttentionCenter: number,
  attentionCenterCode: string,
  attentionCenterName: string,
  cityName?:string,
  countryName?:string,
  departmentName?:string,
  idCity: number,
  idCountry: number,
  idDepartment: number,
  telephoneNumber: string,
  address: string,
  urlLocation: string,
  active :boolean
  idUserAction: number
  fullNameUserAction?:string
}
export interface SedeStatus{
  id: number;
  status: boolean;
  idUserAction : number;
}
