import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigService } from '@app/services/config/config.service';
import { IGetHomologateEntity } from '@app/shared/interfaces/interoperability/dictorionary-model';
import { IResponseProcedencia } from '@app/shared/interfaces/procedencias/procedencias.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProcedenciasService {

  http = inject(HttpClient);
  cs = inject(ConfigService);

  /**
  * SERVICIO - OBTENER FILTRADA LISTA DE PROCEDENCIAS Y ENTIDADES
  *
  * Recupera un array de registros relacionados a las procedencias y entidades.
  * @returns {Observable<any>} Un observable de tipo <any>.
  */
  getListEntities(request: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Procedencia/filter`, request);
  }

  /**
  * SERVICIO - OBTENER CONTRATOS POR TERCEROS
  *
  * Recupera un array de registros de contratos de terceros
  * @returns {Observable<any>} Un observable de tipo <any>.
  */
  getListThirtContracts(companieCode: any): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/IntegracionHIS/contracts/companie/${companieCode}`);
  }

  /**
  * SERVICIO - OBTENER HOMOLOGACION ENTIDAD
  *
  * Recupera la homologacion de la entidad
  * @returns {Observable<any>} Un observable de tipo <any>.
  */
  getHomologationEntity(companieCode: IGetHomologateEntity): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Homologacion/Search`,companieCode);
  }

  /**
  * SERVICIO - OBTENER DETALLE DE PROCEDENCIA
  *
  * Recupera el detalle de una procedencia, con base a su ID.
  * @returns {Observable<any>} Un observable de tipo <any>.
  */
  getDetailEntity(id: any): Observable<IResponseProcedencia> {
    return this.http.get<IResponseProcedencia>(`${this.cs.base}api/Procedencia/${id}`);
  }

  /**
  * SERVICIO - GUARDAR LA CREACIÓN Y EDICIÓN DE PROCEDENCIA
  *
  * Permite guardar la creación y edición de una procedencia.
  * @returns {Observable<any>} Un observable de tipo <any>.
  */
  saveEntity(request: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Procedencia`,request);
  }

  /**
  * SERVICIO - ACTIVAR O DESACTIVAR UN REGISTRO DE PROCEDENCIA Y ENTIDAD
  *
  * Permite cambiar el estado de activiación del registro con base al ID.
  * @returns {Observable<any>} Un observable de tipo <any>.
  */
  updateEntityStatus(request: any): Observable<any> {
    return this.http.put<any>(`${this.cs.base}api/Procedencia/activeDesactive`, request);
  }

  /**
  * SERVICIO - ELIMINAR REGISTRO DE PROCEDENCIA Y ENTIDAD
  *
  * Permite eliminar un registro con base al ID de una procedencia.
  * @param idOriginEntity El ID de la procedencia.
  * @returns {Observable<any>} Un observable de tipo <any>.
  */
  deleteEntity(idOriginEntity: any): Observable<any> {
    return this.http.delete<any>(`${this.cs.base}api/Procedencia/${idOriginEntity}`);
  }
}
