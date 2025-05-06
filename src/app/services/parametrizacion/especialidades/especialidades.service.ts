import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../../config/config.service';
import { SpecialtyResponse } from '../../../shared/interfaces/parametrizacion/especialidades.model';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadesService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  // Metodo que permite el retorno de Especialidad
  getSpecialization(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Especialidad/list`, data);
  }

   // Metodo que permite crear y editar Especialidad
  saveEspecialidades(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Especialidad`, data);
  }

   // Metodo que permite cambiar el estado del Especialidad
  saveStatusSpecialization(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Especialidad/ChangeStatus`, data);
  }

   // Metodo que permite eliminar Especialidad
  deleteSpecialization(IdSpecialization: string): Observable<any> {
    return this.http.delete<any>(`${this.cs.base}api/Especialidad/${IdSpecialization}`);
  }

  //Metodo que permite el retorno de iconos por id
  getIconos(idIcon: any): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Especialidad/Icon/${idIcon}`);
  }
  //Metodo que permite el retorno de iconos
  getEspecialidadIcon(data: any): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Especialidad/Icon`, data);
  }
  //Metodo que permite el retorno de operadores logicos
  getOperatorLogic(data: any): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Especialidad/operators`, data);
  }
}
