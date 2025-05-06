import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@app/services/config/config.service';
import { ChangeStatusHomologation, Homologation, HomologationsByNamePage } from '@app/shared/interfaces/interoperability/homologations.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomologationsService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  // Metodo que retorna homologaciones paginados y por nombre
  getHomologations(data: HomologationsByNamePage): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Homologacion/filter`, data);
  }
  //Eliminacion de homologacion
  deleteHomologations(idHomologation: number): Observable<any> {
    return this.http.delete(`${this.cs.base}api/Homologacion/${idHomologation}`)
  }
  //Cambiar estado
  changeStatusHomologation(statusObj: ChangeStatusHomologation): Observable<any> {
    return this.http.put(`${this.cs.base}api/Homologacion/status`, statusObj)
  }
  //Crear o editar homologación

  createOrUpdateHomologation(data: Homologation) {
    return this.http.post<any>(`${this.cs.base}api/Homologacion`, data);
  }



}
