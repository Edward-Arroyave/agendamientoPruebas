import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { Observable } from 'rxjs';
import { Rol, RolStatus, StatusRol } from '../../shared/interfaces/roles/roles.model';

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  getAllRoles(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Rol`)
  }
  createUpdateRol(rol : Rol): Observable<any> {
    return this.http.post(`${this.cs.base}api/Rol`, rol)
  }
  getRolById(idRol : number): Observable<any> {
    return this.http.get(`${this.cs.base}api/Rol/${idRol}`)
  }

  deleteRol(idRol : number): Observable<any> {
    return this.http.delete(`${this.cs.base}api/Rol/${idRol}`)
  }
  statusRolChange(rolStatus : RolStatus): Observable<any> {
    return this.http.post(`${this.cs.base}api/Rol/Estado`, rolStatus)
  }
  //Listado de tipos de rol
  rolTypesList(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Rol/TipoRol`)
  }


  //Permisos rol
  getPermissesByRol(idRol : number): Observable<any> {
    return this.http.get(`${this.cs.base}api/Rol/permisos-rol/${idRol}`)
  }
  changeStatusPermissesRol(statusRol : StatusRol): Observable<any> {
    return this.http.post(`${this.cs.base}api/Rol/permisos-rol/ChangeStatus`,statusRol)
  }


}
