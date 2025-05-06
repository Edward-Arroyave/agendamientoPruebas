import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { map, Observable } from 'rxjs';
import { AuthService } from '../autenticacion/auth..service';
import moment from 'moment';
import { categoryPlace } from '@app/shared/interfaces/parametrizacion/categoria.model';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  tokenH: string | null = '';

  constructor(
    private http: HttpClient,
    private cs: ConfigService,
    private authSvc: AuthService
  ) {
    this.tokenH = this.authSvc.getTokenHis();
  }

  //Traer tipos de documento de identidad
  documentsTypes(): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Documents`);
  }

  //Traer tipos de sexo o genero o biologicalSex
  biologicalSex(): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/TipoGenero`);
  }
  //Traer paises
  getCountries(): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Pais`);
  }
  //Traer departamentos
  getDepartaments(idPais: number): Observable<any> {
    let body = {
      id: idPais,
    };
    return this.http.post<any>(`${this.cs.base}api/Departamentos`, body);
  }
  //Traer cuidades
  getCities(idDepartment: any): Observable<any> {
    let body = {
      id: idDepartment,
    };
    return this.http.post<any>(`${this.cs.base}api/Ciudad`, body);
  }
  // Traer sedes
  getSedes(): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Sede/active`);
  }
  // Traer sedes por ciudad
  getSedesbyCity(idCity: number): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Sede/active/${idCity}`);
  }

  // Traer categorias
  getCategory(): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Categoria/Active`);
  }

  // Traer categorias por ciudad
  getCategoryByCity(idCity : number): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/ConfiguracionAgenda/category/city/${idCity}`);
  }
  // Traer categorias por pais, departamento y ciudad
  getCategoryPlace(data : categoryPlace): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Categoria/place`,data);
  }

  // Traer especialidades
  getSpecialization(idCategory: number): Observable<any> {
    return this.http.get<any>(
      `${this.cs.base}api/Especialidad/Active/${idCategory}`
    );
  }

  // Traer caracteristicas
  getCharacteristic(idSpeciality: number): Observable<any> {
    return this.http.get<any>(
      `${this.cs.base}api/Caracteristicas/Active/${idSpeciality}`
    );
  }

  // Traer condicion especial
  getCondicionEspecial(): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/CondicionEspecial`);
  }

  // Traer Elementos
  getElementos(idCharacteristic: number): Observable<any> {
    return this.http.get<any>(
      `${this.cs.base}api/Elementos/Active/${idCharacteristic}`
    );
  }

  //Traer listado de procedencias
  getListProcedencias(): Observable<any> {
    let request = {
      origin: '',
      entity: '',
    };

    return this.http
      .post<any>(`${this.cs.base}api/Procedencia/filter`, request)
      .pipe(
        map((response) =>
          response.data.filter((elemento: any) => elemento.active)
        )
      );
  }

  obtenerIdUserAction() {
    let token = this.authSvc.decodeToken();
    if (token) {
      return Number(token.IdUser);
    } else {
      return 0;
    }
  }

  obtenerNameUserAction() {
    let token = this.authSvc.decodeToken();
    if (token) {
      return String(token.IdPatient[0]);
    } else {
      return '';
    }
  }

  obtenerIdRol() {
    let token = this.authSvc.decodeToken();
    if (token) {
      return Number(token.UserRol);
    } else {
      return 0;
    }
  }

  formatearFecha(fecha: any) {
    const date = new Date(fecha);
    return date.toISOString();
  }

  obtenerPermisosModulo(moduloName: string) {
    const permisosTotales = this.authSvc.getMenuByUser();
    if (permisosTotales) {
      let permisoModulo;
      //Es menu padre
      permisoModulo = permisosTotales.find(
        (options: any) => options.Name == moduloName
      );
      if (!permisoModulo) {
        //Es menu hijo
        for (const menuPadre of permisosTotales) {
          permisoModulo = menuPadre.Children.find(
            (options: any) => options.Name == moduloName
          );
          if (permisoModulo) break;
        }
      }
      return permisoModulo;
    }
  }

  //funcion que valida si la agenda es mayor a la hora actual
  EsRangoValido(fecha: any, startTime: any, fechaCreatinina?: Date): boolean {
    const soloFecha = fecha.split('T')[0];
    const today = new Date();
    const desiredDate = moment(soloFecha, 'YYYY-MM-DD').toDate();

    // Compara solo la fecha, sin tener en cuenta la hora.
    const isSameDay =
      desiredDate.getFullYear() === today.getFullYear() &&
      desiredDate.getMonth() === today.getMonth() &&
      desiredDate.getDate() === today.getDate();

      if (desiredDate > today) {
        if (fechaCreatinina) {
          if(desiredDate > fechaCreatinina){
          return false;
        }
      }
      return true;
    } else if (isSameDay) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const currentHours = today.getHours();
      const currentMinutes = today.getMinutes();

      // Verifica si startTime es mayor que la hora actual
      return (
        startHours > currentHours ||
        (startHours === currentHours && startMinutes > currentMinutes)
      );
    } else {
      return false;
    }
  }
}
