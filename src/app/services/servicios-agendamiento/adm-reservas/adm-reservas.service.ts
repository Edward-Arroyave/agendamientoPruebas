import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@app/services/config/config.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdmReservasService {
  constructor(private http: HttpClient, private cs: ConfigService) {
  }
  //Consultar reservas administrativo
  consultReservations(reservationData: any): Observable<any> {
    return this.http.post(`${this.cs.base}api/Cita/filter`, reservationData)
  }

  //Eliminar Reserva
  deleteReservations(data: any): Observable<any> {
    return this.http.delete(`${this.cs.base}api/Cita`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  //Eliminar cita
  deleteCita(data: any): Observable<any> {
    return this.http.delete(`${this.cs.base}api/Cita`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }


  //Confirmar Reserva()
  confirmReservation(data: any): Observable<any> {
    return this.http.put(`${this.cs.base}api/Cita/confirm`, data)
  }

  
  //Metodo que permite el retorno del detalle de cita o reserva según Id
  detailReservation(idAppointment : number): Observable<any> {
    return this.http.get(`${this.cs.base}api/Cita/detail/${idAppointment }`)
  }

  //Obtener disponibilidad de cita dada la especialidad o elemento a agendar
  dispCita(data: any): Observable<any> {
    return this.http.put(`${this.cs.base}api/Cita/available/agenda`, data)
  }  

  //Metodo que permite generar reprogramación de un agendamiento.
  GenerarReprogramacion(reservationData: any): Observable<any> {
    return this.http.post(`${this.cs.base}api/Cita/reschedule`, reservationData)
  }
  //Traer archivos segun reserva

  getFiles(idReserva : number, idType: number): Observable<any> {
    return this.http.get(`${this.cs.base}api/Cita/file/${idReserva}/type/${idType}`)
  }
}
