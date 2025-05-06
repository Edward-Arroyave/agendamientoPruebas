import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@app/services/config/config.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigAgendaService {

  constructor(private http: HttpClient, private cs: ConfigService) {
  }

  //?Traer toda la agenda//
  getConfigAgenda(filtro: any): Observable<any> {
    return this.http.post(`${this.cs.base}api/ConfiguracionAgenda/filter`, filtro)
  }

  //?Traer egenda por id//
  getAgendaId(idAgenda: any): Observable<any> {
    return this.http.get(`${this.cs.base}api/ConfiguracionAgenda/detail/${idAgenda}`)
  }

    //?Lista de procedencias//
  getProcedencias(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Procedencia/list`)
  }

  //?Traer detelle de la agenda de parametro y configuración
  getDetailConfigAgenda(idAgenda: any): Observable<any> {
    return this.http.get(`${this.cs.base}api/ConfiguracionAgenda/detail/${idAgenda}`)
  }

  //?Actualizar el estado de la agenda
  UpdateStateAgenda(objetoEstado: any): Observable<any> {
    return this.http.post(`${this.cs.base}api/ConfiguracionAgenda/update/status`, objetoEstado)
  }

  //?eliminación  de configuración de agenda
  deleteConfigAgenda(idAgenda: any): Observable<any> {
    return this.http.delete(`${this.cs.base}api/ConfiguracionAgenda/delete/${idAgenda}`)
  }
  //?Crear configuración de agenda
  createConfigAgenda(objeto: any): Observable<any> {
    return this.http.post(`${this.cs.base}api/ConfiguracionAgenda/create`, objeto)
  }
  //?Actualizar configuración de agenda
  UpdateAgendaConfig(objeto: any): Observable<any> {
    return this.http.put(`${this.cs.base}api/ConfiguracionAgenda/update`, objeto)
  }

  //Traer dias de horarios especiales

  getDaysSpecials(): Observable<any> {
    return this.http.get(`${this.cs.base}api/DiaServicio`)
  }



}
