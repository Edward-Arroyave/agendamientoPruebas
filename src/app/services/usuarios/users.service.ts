import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { StatusUserPermises, UpdatePassUser, User, UserChangueSatus } from '../../shared/interfaces/usuarios/users.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  getAllUsers(page : number , size : number) : Observable<any> {
    return this.http.get(`${this.cs.base}api/User/${page}/${size}`)
  }
  //Traer usuarios por filtro de nombres

  getUsersByFilter(page : number , size : number, filter : any) : Observable<any> {
    return this.http.post(`${this.cs.base}api/User/buscar/${page}/${size}`,filter)
  }
  getUserById(idUser : any) : Observable<any> {
    return this.http.get(`${this.cs.base}api/User/${idUser}`)
  }
  createUpdateUser(user : User): Observable<any> {
    return this.http.post(`${this.cs.base}api/User`, user)
  }
  deleteUser(idUser : any): Observable<any> {
    return this.http.delete(`${this.cs.base}api/User/${idUser}`)
  }
  changueStatusUser(user : UserChangueSatus): Observable<any> {
    return this.http.post(`${this.cs.base}api/User/ChangeStatus`, user)
  }
  updatePass(user : any): Observable<any> {
    return this.http.post(`${this.cs.base}api/User/updatePass`, user)
  }
  listadoDePeriodosdeRenovacionContrasena(): Observable<any> {
    return this.http.get(`${this.cs.base}api/RenuevoPeriodicoPass`)
  }

  //Traer listado de permisos por usuario
  getPermissesByUser(idUser : any): Observable<any> {
    return this.http.get(`${this.cs.base}api/User/permisos-user/${idUser}`)
  }
  //Cambiar estado de un permiso
  UpdatePermisesUser(userPermisos : StatusUserPermises): Observable<any> {
    return this.http.post(`${this.cs.base}api/User/permisos-user`, userPermisos)
  }

  // Traer foto del usuario
  getUserPhoto(photourl : any) : Observable<any> {
    return this.http.get(`${this.cs.base}api/User/Photo/${photourl}`)
  }

  //Enviar credenciales al correo electronico
  sendEmailCredentials(idUser : any) : Observable<any> {
    return this.http.get(`${this.cs.base}api/User/email/${idUser}`)
  }


}
