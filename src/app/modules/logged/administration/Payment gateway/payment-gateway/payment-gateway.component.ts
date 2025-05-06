import { MatTooltipModule } from '@angular/material/tooltip';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LoaderService } from '@app/services/loader/loader.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { lastValueFrom } from 'rxjs';
import { PaymentGatewayService } from '@app/services/payment-gateway/payment-gateway.service';
import { IpaymentGateway } from '@app/shared/interfaces/payment-gateway/payment-gateway.model';

@Component({
  selector: 'app-payment-gateway',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './payment-gateway.component.html',
  styleUrl: './payment-gateway.component.scss'
})
export class PaymentGatewayComponent {

  permisosDelModulo: any
  //paymentConfiguration: any = { id: 1, userName: 'User_Admin12351848', time: '15 Minutos', url: 'www.ejemplodepaginaweb.com/long-path-to-nowhere/this-is-just-a-fake-url-for-demo-purposes/' }
  paymentConfiguration: IpaymentGateway | null = null
  times: any[] = [];


  constructor(private router: Router, private loaderSvc: LoaderService,
    private shadedSVC: SharedService, private paymentSvc: PaymentGatewayService) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Pasarela de pagos')
  }


  async ngOnInit(): Promise<void> {
    await this.getTimesOfPayment()
    await this.getPaymentsConfigured();
  }

  async getPaymentsConfigured() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando configuración' })
      let p = await lastValueFrom(this.paymentSvc.paymentGateway());
      if (p.data) {
        p.data.idUnitOfTime = this.times.find(e => e.idUnitOfTime == p.data.idUnitOfTime).unitOfTime
        this.paymentConfiguration = p.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }


  async getTimesOfPayment() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando tiempos de pago' })
      let items = await lastValueFrom(this.paymentSvc.configurationTimes());
      if (items.data) {
        this.times = items.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  edit(idGateway: number) {
    this.router.navigate(['/inicio/administracion/gateway/form/' + idGateway])
  }

  add() {
    this.router.navigate(['/inicio/administracion/gateway/form'])
  }

}
