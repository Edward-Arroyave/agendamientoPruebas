import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { configVisual } from '@app/shared/interfaces/configuracion-visual/config-visual';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionVisualService {


  constructor(private http:HttpClient,private cs: ConfigService) {
  }

  getConfiguracionVisual(){
    return this.http.get(`${this.cs.base}api/ConfiguracionVisual`)
  }

  CrearActualizarConfiguracionVisual(data:configVisual){
    return this.http.post(`${this.cs.base}api/ConfiguracionVisual`,data)
  }

}
