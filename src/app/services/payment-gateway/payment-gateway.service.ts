import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { Observable } from 'rxjs';
import { IpaymentGateway } from '@app/shared/interfaces/payment-gateway/payment-gateway.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentGatewayService {

  constructor(private http: HttpClient, private cs: ConfigService) { }

  //Metodo para traer pasarela de pagos configuradas
  paymentGateway(): Observable<any> {
    return this.http.get(`${this.cs.base}api/PasarelaPagos`)
  }
  //Metodo para traer tiempos de pagos
  configurationTimes(): Observable<any> {
    return this.http.get(`${this.cs.base}api/PasarelaPagos/ConfigurationTimes`)
  }

  //Metodo para taer el contrato particular
  contratoParticular(): Observable<any> {
    return this.http.get(`${this.cs.base}api/PasarelaPagos`)
  }

  //Metodo para crear o actualizar pasarela de pagos
  createUpdatePaymentGateway(paymentGateway : IpaymentGateway): Observable<any> {
    return this.http.post(`${this.cs.base}api/PasarelaPagos/createUpdate`, paymentGateway)
  }



}
