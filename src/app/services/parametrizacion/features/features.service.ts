import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../../config/config.service';

@Injectable({
  providedIn: 'root'
})
export class FeaturesService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  // Metodo que permite el retorno de Caracteristicas
  getCharacter(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Caracteristicas/list`, data);
  }

   // Metodo que permite crear y editar Caracteristicas
  saveCharacter(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Caracteristicas`, data);
  }

   // Metodo que permite cambiar el estado del Caracteristicas
  saveStatusCharacter(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Caracteristicas/ChangeStatus`, data);
  }

   // Metodo que permite eliminar Caracteristicas
  deleteCharacter(idCharacteristic: string): Observable<any> {
    return this.http.delete<any>(`${this.cs.base}api/Caracteristicas/${idCharacteristic}`);
  }
}

