export interface User {
  idUser: number;
  idIdentificationType: number;
  identificationNumber: string;
  name: string;
  lastName: string;
  idCountry: number;
  idCity: number;
  idDepartment: number;
  idBiologicalSex : number;
  birthDate: string;  // Usar 'string' si es ISO formato de fecha, de lo contrario 'Date'
  userName: string;
  phone : string;
  phone2?: string;
  email: string;
  idRole: number;
  idProfession: number;
  registrationNumber?: string | null;
  accountExpires: boolean;
  expirationDate?: string | null;  // Usar 'string' si es ISO formato de fecha, de lo contrario 'Date'
  password?: string;
  passwordExpires: boolean;
  idPasswdRenewalPeriod?: number;
  passwordExpirationDate?: string | null;  // Usar 'string' si es ISO formato de fecha, de lo contrario 'Date'
  photoNameContainer?: string | null;
  signatureNameContainer?: string;
  active: boolean;
  idPatient?: number
  extensionPhoto?: string | null
  idUserAction: number
  fullNameUserAction?: string;
}



export interface UserChangueSatus {
  id: number;
  status: boolean;
  idUserAction: number;
}
export interface UpdatePassUser {
  currentPassword? : string;
  newPassword : string;
  idUser : number
}

export interface StatusUserPermises {
  idUser_Menu : number,
  idUser: number,
  idMenu: number,
  toRead: boolean,
  toCreate: boolean,
  toUpdate: boolean,
  toDelete: boolean,
  idUserAction: number
  fullNameUserAction?: string;
  name?: string;
}


export interface UserUpdatePassword {
  currentPassword? : string | null;
  newPassword : string;
  idUser : number
  FirstTime? : boolean
  Renewal? : boolean
}

export interface ILogin{
  userName:string
  password:string
  typeUser:1
}
