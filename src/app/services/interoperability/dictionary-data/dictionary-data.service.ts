import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@app/services/config/config.service';
import { DictionarysByNamePage, ChangeStatusDictionary, CreateDictionary } from '@app/shared/interfaces/interoperability/dictorionary-model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DictionaryDataService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  // Metodo que retorna diccionarios paginados y por nombre
  getDictionarys(data: DictionarysByNamePage): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Diccionario/filter`, data);
  }
  //Eliminacion de diccionario
  deleteDictionary(idIntegration: number): Observable<any> {
    return this.http.delete(`${this.cs.base}api/Diccionario/${idIntegration}`)
  }
  //Cambiar estado
  changeStatusDictionary(statusObj: ChangeStatusDictionary): Observable<any> {
    return this.http.put(`${this.cs.base}api/Diccionario/status`, statusObj)
  }

  //Crear o actualizar un diccionario

  createUpdateDictionary(objeto: CreateDictionary): Observable<any> {
    return this.http.post(`${this.cs.base}api/Diccionario/createUpdate`, objeto)
  }
  //Traer listado de tablas de la base de datos
  getTablesDb(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Diccionario/tables`)
  }
  //Traer tablas de id y descipcion con nombre de tabla
  getTablesByName(tableName: string): Observable<any> {
    return this.http.get(`${this.cs.base}api/Diccionario/${tableName}/fields`)
  }
  //Diccionario de datos activos
  getDictionaryActives(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Diccionario/actives`)
  }
  // Traer codigos propios por diccionario
  getCodesOwnById(idDataDictionary: number): Observable<any> {
    return this.http.get(`${this.cs.base}api/Diccionario/${idDataDictionary}/table/registers`)
  }
}
