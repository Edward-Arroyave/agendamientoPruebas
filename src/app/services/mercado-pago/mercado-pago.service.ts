import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { Observable } from 'rxjs';
import { IPreferencia } from '@app/shared/interfaces/mercado-pago/mercado-pago.interface';

@Injectable({
  providedIn: 'root'
})
export class MercadoPagoService {

  private URLactual = window.location.href;

  constructor(private http: HttpClient, private cs: ConfigService) { }

  crearPreferencia(preferencia : any): Observable<any> {
    return this.http.post(`${this.cs.base}api/PasarelaPagos/preferencia`,preferencia)
  }
  
  obtenerPreferencia(idPreferencia : string): Observable<any> {
    return this.http.get(`${this.cs.base}api/PasarelaPagos/preferencia/${idPreferencia}`)
  }
  obtenerPagoPorId(idPayment : string): Observable<any> {
    return this.http.get(`${this.cs.base}api/PasarelaPagos/paymentById/${idPayment}`)
  }

  obtenerCostoExamen(instServiceCode:string,cups:string,particularContractCode:string ): Observable<any>{
    return this.http.get(`${this.cs.base}api/PasarelaPagos/consultServicesPayment/${instServiceCode}/${cups}/${particularContractCode}`);
  }

  obtenerInstCode(data:any): Observable<any>{
    return this.http.post(`${this.cs.base}api/PasarelaPagos/consultIntitucionalCodeExternal`,data);
  }

}
