import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@app/services/config/config.service';
import { IReservar } from '@app/shared/interfaces/agendar-cita/agendar-cita.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AgendarCitaService {

  constructor(private http: HttpClient, private cs: ConfigService) {
  }

  //?Creacion de reserva//
  crearReserva(data:IReservar): Observable<any> {
    return this.http.post(`${this.cs.base}api/Cita/create`, data);
  }
}
