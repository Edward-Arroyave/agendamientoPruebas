import { Injectable } from '@angular/core';
import { Patient } from '../../shared/interfaces/pacientes/patient.model';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../config/config.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientService {

  constructor(private http: HttpClient, private cs: ConfigService) { }


  createPatient(patient: Patient): Observable<any> {
    return this.http.post(`${this.cs.base}api/Paciente`, patient)
  }


  //* Servicios para componente de actualizacion de datos

  // PUT /api/Paciente/{idUser}: Edita un paciente y a la vez el usuario paciente
  editarPaciente(idUser: any, pacienteData: any): Observable<any> {
    return this.http.put(`${this.cs.base}api/Paciente/${idUser}`, pacienteData);
  }

  // POST /api/Paciente/buscar/{desde}/{hasta}: Busca Pacientes
  buscarPacientes(desde: string, hasta: string, criteriosBusqueda: any): Observable<any> {
    return this.http.post(`${this.cs.base}api/Paciente/buscar/${desde}/${hasta}`, criteriosBusqueda);
  }

  // GET /api/Paciente/{desde}/{hasta}: Lista de pacientes
  listarPacientes(desde: string, hasta: string): Observable<any> {
    return this.http.get(`${this.cs.base}api/Paciente/${desde}/${hasta}`);
  }

  // GET /api/Paciente/{idPatient}: Pacientes por id
  obtenerPacientePorId(idPatient: string): Observable<any> {
    return this.http.get(`${this.cs.base}api/Paciente/${idPatient}`);
  }

  //Obtener relacion o tipo de parentescos
  getRelationship(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Paciente/RelationShip`);
  }

}
