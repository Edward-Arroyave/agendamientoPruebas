import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@app/services/config/config.service';
import { MonitorByNamePage } from '@app/shared/interfaces/interoperability/monitor.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  // Metodo que retorna monitor  paginados y por nombre
  getMonitor(data: MonitorByNamePage): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/MonitorControl/filter`, data);
  }

  crearMonitorPagos(data: any) {
    return this.http.post<any>(`${this.cs.base}api/MonitorControl/crear/pagos`, data);
  }

  // Metodo  para traer los estados lista
  getStatusList(): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/MonitorControl/status`);
  }
  // Metodo  para traer los Procesos lista;
  getProcessList(): Observable<any> {
    return this.http.get<any>(`${this.cs.base}api/MonitorControl/process`);
  }

}
