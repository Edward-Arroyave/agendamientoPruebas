import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { Observable } from 'rxjs';
import { ChangeStatusExam, ExamByNamePage, ExamLaboratory, ListChargueExam } from '@app/shared/interfaces/exams-laboratory/exams-laboratory.model';

@Injectable({
  providedIn: 'root'
})
export class ExamsLaboratoryService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  // Traer listado de cups //
  getListCups(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Examen/cups`)
  }

  // Metodo que permite el retorno de examenes buscandolos por nombre y implementando un paginador

  getListExamsByNamePage(examByNamePage: ExamByNamePage): Observable<any> {
    return this.http.post(`${this.cs.base}api/Examen/filter`, examByNamePage)
  }

  //Traer examen por id

  getExamById(idExam :number): Observable<any> {
    return this.http.get(`${this.cs.base}api/Examen/${idExam}`)
  }

  getExamRequeriments(listIdExam :string): Observable<any> {
    return this.http.get(`${this.cs.base}api/Examen/requeriments/${listIdExam}`)
  }


  //Trae todos los examenes

  getAllExam(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Examen/allExam`)
  }

  //Metodo para traer requerimientos por examen

  getRequirementsByExam(idExam: string): Observable<any> {
    return this.http.get(`${this.cs.base}api/Examen/requeriments/${idExam}`)
  }

  //Metodo para activa o desactivar un examen
  changeStatusExam(changeStatusExam: ChangeStatusExam): Observable<any> {
    return this.http.put(`${this.cs.base}api/Examen/activarDesactivar`, changeStatusExam)
  }

  //Metodo para eliminar un examen configurado

  deleteExam(idExam: number): Observable<any> {
    return this.http.delete(`${this.cs.base}api/Examen/${idExam}`)
  }

  //Guardar carga masiva de examenes

  saveMultiExamsChargue(exam : ListChargueExam): Observable<any> {
    return this.http.post(`${this.cs.base}api/Examen/chargue`, exam)
  }
  //Guardar carga masiva de examenes

  saveOrUpdateExam(exam : ExamLaboratory): Observable<any> {
    return this.http.post(`${this.cs.base}api/Examen`, exam)
  }
}
