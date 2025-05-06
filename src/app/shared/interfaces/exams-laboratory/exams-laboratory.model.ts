
export interface ExamByNamePage {
  examName: string,
  pageSize: number,
  pageNumber: number
}

export interface ChangeStatusExam {
  idEntitie: number,
  active: boolean,
  idUserAction: number
}

export interface GetExam {
  checked?: boolean;
  idExam: number;
  active: boolean;
  cups: string;
  examName: string;
  fullNameUserAction: string;
  idUserAction: number
}
export interface ExamLaboratory {
  idExam: number;
  cups: string;
  examName: string;
  preconditions: string;
  indications: string;
  biologicalSex: string;
  active?: boolean;
  fullNameUserAction: string;
  idUserAction: number
  listRequeriments?: any[] | null
  listIdsRequerimentExam: any[] | null
}

export interface ListChargueExam {
  listChargueExam: ExamLaboratory[];
}

export interface nuevaListaExam{
  nombreExamn:string;
  arrItems:string[];
  checked:boolean;
  indications:string;
  preconditions:string;
}
