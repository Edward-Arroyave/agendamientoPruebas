
export interface Rol {
  idRole: number;
  roleName: string;
  idTypeRole: number;
  idUserAction: number;
  fullNameUserAction?: string;
  typeRoleName?: string;
  active :boolean
}

export interface RolStatus {
  id: number;
  status: boolean;
  idUserAction: number;
}

export interface StatusRol {
  idRole_Menu: number;
  idRol: number,
  idMenu: number,
  toRead: boolean,
  toCreate: boolean,
  toUpdate: boolean,
  toDelete: boolean
  idUserAction: number
  fullNameUserAction?: string;
  name?: string;
}
