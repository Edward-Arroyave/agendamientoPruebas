import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@app/services/config/config.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreparationsService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  // Metodo que permite el retorno de preparaciones filtrandolas por el codigo
  getPreparationForCode(preparationCode: any): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Preparacion/filter/${preparationCode}`);
  }

  // Metodo que permite obtener el detalle de una preparacion mediante el id
  getPreparationForId(idPreparation: any): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Preparacion/${idPreparation}`);
  }
  // Metodo que permite obtener el detalle de una preparacion
  getDetail(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Preparacion/detail/procedure`,data);
  }

  // Metodo que permite eliminar preparacion
  deletePreparation(idPreparation: string): Observable<any> {
    return this.http.delete<any>(`${this.cs.base}api/Preparacion/${idPreparation}`);
  }

   // Metodo que permite crear y editar preparaciones
   saveCreatePre(preparacionData: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Preparacion`, preparacionData);
  }

   // Metodo que permite activar o desactivar preparacion
  saveStatusPre(preparacionData: any): Observable<any> {
    return this.http.put<any>(`${this.cs.base}api/Preparacion/activeDesactive`, preparacionData);
  }

}
