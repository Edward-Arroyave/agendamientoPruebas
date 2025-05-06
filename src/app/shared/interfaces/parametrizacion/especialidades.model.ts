export interface SpecialtyResponse {
    ok: boolean;
    message: string;
    data: Especialidades[];
  }

  export interface Especialidades {
    idSpecialties: number;
    specialtiesName: string;
    idCity: any;
    cityName: string;
    idAttentionCenter: any;
    attentionCenterName: string;
    idCategory: any;
    categoryName: string;
    idIconSpecialties: any;
    medicalAuthorization: boolean | null;
    medicalOrder: boolean | null;
    clinicHistory: boolean | null;
    active: boolean;
    idUserAction: number;
    fullNameUserAction : string;
    }

    export interface escialityStatus{
      id: number;
      status: boolean;
      idUserAction: number;
    }
