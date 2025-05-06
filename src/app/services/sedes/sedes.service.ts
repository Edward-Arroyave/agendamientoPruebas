import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { Observable } from 'rxjs';
import { Sede, SedeStatus } from '../../shared/interfaces/sedes/sedes.model';

@Injectable({
  providedIn: 'root'
})
export class SedesService {

  constructor(private http: HttpClient, private cs: ConfigService) { }


  getSedesList(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Sede`)
  }
  getSedeById(idAttentionCenter: number): Observable<any> {
    return this.http.get(`${this.cs.base}api/Sede/${idAttentionCenter}`)
  }
  createUpdateSede(objetoSede: Sede): Observable<any> {
    return this.http.post(`${this.cs.base}api/Sede`, objetoSede)
  }
  deleteSede(idAttentionCenter: number): Observable<any> {
    return this.http.delete(`${this.cs.base}api/Sede/${idAttentionCenter}`)
  }
  changeStatusSede(statusObj: SedeStatus): Observable<any> {
    return this.http.post(`${this.cs.base}api/Sede/Estado`, statusObj)
  }

}
