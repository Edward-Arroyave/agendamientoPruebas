export interface CategoriaResponse {
  ok: boolean;
  message: string;
  data: Categoria[];
}

export interface Categoria {
    idCategory: number;
    categoryName: string;
    description: string;
    active: boolean;
    requireElements?: boolean;
    associatedExam?: boolean;
    idUserAction: number;
    fullNameUserAction?:string;
  }

  export interface categoryStarus{
    id: number;
    status: boolean;
    idUserAction: number;
  }

  export interface categoryPlace{
    idCity : number
    idDepartment : number
    idCountry : number
  }
  