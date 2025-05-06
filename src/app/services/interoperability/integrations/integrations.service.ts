import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '@app/services/config/config.service';
import { ChangeStatusIntegration, Integration, IntegrationsByNamePage } from '@app/shared/interfaces/interoperability/integrations-model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IntegrationsService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  // Metodo que retorna integraciones paginados y por nombre
  getIntegrations(data: IntegrationsByNamePage): Observable<any> {
    return this.http.post<any>(`${this.cs.base}api/Integracion/filter`, data);
  }
  //Eliminacion de integración
  deleteIntegration(idIntegration: number): Observable<any> {
    return this.http.delete(`${this.cs.base}api/Integracion/${idIntegration}`)
  }
  //Cambiar estado
  changeStatusIntegration(statusObj: ChangeStatusIntegration): Observable<any> {
    return this.http.put(`${this.cs.base}api/Integracion`, statusObj)
  }

  //Crear o editar una integración
  createOrEditIntegration(integration: Integration): Observable<any> {
    return this.http.post(`${this.cs.base}api/Integracion`, integration)
  }

  //Integraciones activas
  getIntegrationsActive(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Integracion/active`)
  }


}
