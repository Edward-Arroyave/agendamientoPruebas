import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { jwtDecode } from "jwt-decode";
import { ChangeThemeService } from '../cambio-tema/change-theme.service';
import { ModalService } from '../modal/modal.service';
import { Router } from '@angular/router';
import { UserUpdatePassword } from '../../shared/interfaces/usuarios/users.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  currentTheme: string = 'light-theme';

  constructor(private http: HttpClient, private cs: ConfigService, private modalService: ModalService, private router: Router) {
  }

  login(userLogin: any): Observable<any> {

    return this.http.post(`${this.cs.base}api/login`, userLogin).pipe(
      map((resp: any) => {
        if (resp.ok) {
          sessionStorage.clear();
          this.setToken(resp.data[0])
          this.setRefreshToken(resp.data[1])
          this.getMenuByUser()
        }
        return resp;

      }));
  }

  logout() {
    const URLactual = window.location.href;

    let tokenDecoded = this.decodeToken()
    const username = tokenDecoded.sub
    const remember = sessionStorage.getItem('rememberUser');


    sessionStorage.clear();
    if (username && remember) {
      sessionStorage.setItem('username', String(username));
      sessionStorage.setItem('rememberUser', String(remember));
    }
    this.router.navigate(['login'])



  }

  //Envio de correo para el codigo
  sendEmailCode(objetoCorreo: any): Observable<any> {
    return this.http.post(`${this.cs.base}api/User/email`, objetoCorreo)
  }
  //Eliminar codigo para que no funcione mas
  deleteCode(idUser: any): Observable<any> {
    return this.http.get(`${this.cs.base}api/User/Confirm/${idUser}`)
  }
  //Confirmar codigo para cambiar contraseña
  confirmCode(code: any, idUser: any): Observable<any> {
    return this.http.get(`${this.cs.base}api/User/Confirm/${code}/${idUser}`)
  }

  //Cambiar contraseña

  updatePassword(objPass: UserUpdatePassword): Observable<any> {
    return this.http.post(`${this.cs.base}api/User/updatePass`, objPass)
  }




  setToken(token: any) {
    sessionStorage.setItem('token', token);
  }

  setTokenHis(tokenHis: any) {
    sessionStorage.setItem('tokenHis', tokenHis);
  }
  setRefreshToken(tokenHis: any) {
    sessionStorage.setItem('refreshToken', tokenHis);
  }

  getToken() {
    return sessionStorage.getItem('token');
  }
  getTokenHis() {
    return sessionStorage.getItem('tokenHis');
  }
  getTokenRefreshToken() {
    return sessionStorage.getItem('refreshToken');
  }

  decodeToken(): any {
    try {
      let token = sessionStorage.getItem('token')
      if (token) {
        const decoded = jwtDecode(token);
        return decoded;
      } else {
        this.modalService.openStatusMessage('Aceptar', 'Debe iniciar sesión', '4')
        this.router.navigate(['login'])
      }

    } catch (error) {

      return null;
    }
  }


  refreshToken(): Observable<any> {
    try {

      const token = this.getTokenRefreshToken();
      if (!token) {
        throw new Error('Token de refresco no encontrado');
      }
      const tokenDecoded: any = this.decodeToken();
      if (!tokenDecoded || !tokenDecoded.sub || !tokenDecoded.IdUser || !tokenDecoded.UserRol) {
        throw new Error('Información del token inválida');
      }
      const obj = {
        username: tokenDecoded.sub,
        idUser: tokenDecoded.IdUser,
        idRole: tokenDecoded.UserRol,
        fullName: tokenDecoded.IdPatient ? tokenDecoded.IdPatient[0] : null,
        idPatient: tokenDecoded.IdPatient[1] ? tokenDecoded.IdPatient[1] : 0
      };
      return this.http.post(`${this.cs.base}api/Login/refreshToken`, obj);
    } catch (error) {
      this.logout();
      this.modalService.openStatusMessage('Aceptar', 'Debe iniciar sesión', '3');
      return of(null);
    }
  }


  getMenuByUser() {
    let token = this.getToken();
    if (token) {
      let tokenDecoded = this.decodeToken()
      if (tokenDecoded) {
        try {
          const parsedData = JSON.parse(tokenDecoded.Permisos);
          return parsedData;
        } catch (error) {

          return null;
        }
      }
    } else {
      return null;
    }
  }




}
