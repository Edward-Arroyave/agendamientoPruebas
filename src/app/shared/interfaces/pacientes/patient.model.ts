export interface Patient {
  idNationality: number;
  idUserAction: number;
  idPatient: number;
  idIdentificationType: number;
  identificationNumber: string;
  firstName: string;
  secondName: string;
  firstLastName: string;
  secondLastName: string;
  birthDate: any;
  idBiologicalSex: number;
  email: string;
  telephone: string;
  telephone2?: string;
  idCity: number;
  idDepartment: number;
  address: string;
  idCountry: number;
  active?: boolean;
  fullNameUserAction? : string;
  accountExpires? : boolean;
  passwordExpires?: any;
  idPasswdRenewalPeriod?: any,
}
