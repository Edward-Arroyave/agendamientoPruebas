import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@app/services/config/config.service';
import { ConsultAdminEspacio } from '@app/shared/interfaces/agendamiento/admin-espacion.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminEspaciosService {

  constructor(private http: HttpClient, private cs: ConfigService) {
  }

  //?Traer consulta de agendas espacios//
  getAvailableAgenda(consultEspacios: ConsultAdminEspacio): Observable<any> {
    return this.http.put(`${this.cs.base}api/Cita/available/agenda`, consultEspacios)
  }

}
