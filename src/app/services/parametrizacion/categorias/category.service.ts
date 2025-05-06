import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../../config/config.service';
import { Observable } from 'rxjs/internal/Observable';
import { Categoria, CategoriaResponse } from '../../../shared/interfaces/parametrizacion/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  // Metodo que permite el retorno de Categoria
  getCategory(data: any): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/Categoria`, data);
  }

   // Metodo que permite crear y editar Categoria
  saveCreateUpdate(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Categoria`, data);
  }

   // Metodo que permite cambiar el estado del Categoria
  saveStatusCategory(data: any): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Categoria/ChangeStatus`, data);
  }

   // Metodo que permite eliminar Categoria
  deleteCategory(IdCategory: string): Observable<any> {
    return this.http.delete<any>(`${this.cs.base}api/Categoria/${IdCategory}`);
  }

  
  
}
