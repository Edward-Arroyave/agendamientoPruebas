import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../../config/config.service';
import { IExamenesPorElementos, IGetDataAgendaEspacios } from '@app/shared/interfaces/agendar-cita/agendar-cita.interface';

@Injectable({
  providedIn: 'root'
})
export class ElementsService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  // Metodo que permite el retorno de Elementos
  getElementos(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Elementos/list`, data);
  }

  // Metodo que permite crear y editar Elementos
  saveElementos(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Elementos`, data);
  }

  // Metodo que permite cambiar el estado del Elementos
  saveStatusElementos(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Elementos/ChangeStatus`, data);
  }

  // Metodo que permite eliminar Elementos
  deleteElementos(idElement: string): Observable<any> {
    return this.http.delete<any>(`${this.cs.base}api/Elementos/${idElement}`);
  }

  // Metodo que permite el retorno de Condicion Especial
  getCondicionEspecial(data: any): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/CondicionEspecial`, data);
  }

  // Metodo que permite el retorno de Condicion Especial
  getProcedimiento(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Elementos/filter/procedures`, data);
  }

  // Metodo que trae los espacios para agendar
  getProcedimientoPorAgenda(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/ConfiguracionAgenda/searchPossibleAgendas`, data);
  }

  // Metodo que trae elementos filtrados por ids de examenes
  getExamenesConElementoPorIds(data: IExamenesPorElementos): Observable<any> {
    return this.http.put<any>(`${this.cs.base}api/Elementos/exams/asociated`,data);
  }
}
