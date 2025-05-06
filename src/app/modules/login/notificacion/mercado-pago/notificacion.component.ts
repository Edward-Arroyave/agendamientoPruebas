import { CurrencyPipe, DatePipe, NgClass, NgStyle, NgSwitch, NgSwitchCase } from '@angular/common';
import { Component, HostListener, inject, LOCALE_ID, OnDestroy, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/services/autenticacion/auth..service';
import { MonitorService } from '@app/services/interoperability/monitor/monitor.service';
import { MercadoPagoService } from '@app/services/mercado-pago/mercado-pago.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { IStatusMercadoPago } from '@app/shared/interfaces/mercado-pago/mercado-pago.interface';
import { ILogin } from '@app/shared/interfaces/usuarios/users.model';
import moment from 'moment';
import { lastValueFrom } from 'rxjs';


@Component({
  selector: 'app-notificacion',
  standalone: true,
  imports: [NgClass,NgStyle,MatIcon,NgSwitch,NgSwitchCase,DatePipe,CurrencyPipe],
  templateUrl: './notificacion.component.html',
  styleUrl: './notificacion.component.scss',
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ],
})
export class NotificacionComponent  implements OnInit,OnDestroy{
  
  activatedRoute = inject(ActivatedRoute);
  authSvc = inject(AuthService);
  router = inject(Router);
  mercadoPagoService = inject(MercadoPagoService);
  monitorService = inject(MonitorService);
  sharedSvc = inject(SharedService);
  idUser: number = 0;
  noLogged: boolean = false;
  preferencia!: any;
  idNotificacion:number = 0;  

  cuadros: any = [];
  cuadrosInversa: any = [];
  objMercadoPago!:any;

  messajeResponse= {
    success:'¡Pago de la agenda confirmado en el sistema!',
    pending:'¡Pago de la agenda pendiente en el sistema!',
    error:'¡Pago de la agenda rechazado por el sistema!'
  }

  ngOnDestroy(): void {
    if( this.noLogged) sessionStorage.clear();
  }

  ngOnInit(): void {
    let x = this.activatedRoute.snapshot.params;
    this.idNotificacion = x['idNotificacion'];
    this.activatedRoute.queryParams.subscribe(async params => {
      let payment:string = params['payment_id'];
      if(payment.includes("#")){
        payment = payment.split("#")[0];
      }
      this.login(payment);
    });
    this.construirCuadros();
  }

  
  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.construirCuadros()
    }, 100)
  }

  async getPagoByid(idPayment:string){
    try {
      const respPayment = await lastValueFrom(this.mercadoPagoService.obtenerPagoPorId(idPayment));
      if(respPayment.ok){
        this.objMercadoPago = respPayment.data;
      }else{
        console.error(respPayment.message);
      }
    } catch (error) {
      this.objMercadoPago = {
        status : 'rejected',
        dateCreated :moment(),
        additionalInfo:{
          items:[
            {
              unitPrice : '0.0',
              title :'-------',
              description :'El pago no fue PROCESADO o fue RECHAZADO'
            }
          ]
        }
      }
      console.error(error);
    }
  }

  async login(idPayment:string){
    return new Promise(async (resolve,reject) =>{
      if(!sessionStorage.getItem("token")){
        this.noLogged = true;
        const user: ILogin = JSON.parse(import.meta.env.NG_APP_USER);
        await lastValueFrom(this.authSvc.login(user))
              .then(async x => await this.getPagoByid(idPayment))
              .then(async x => await this.crearControl())
              .catch(e => reject(e));
      }else{
        this.noLogged = false;
        await this.getPagoByid(idPayment)
        await this.crearControl();
        resolve(true);
      }
    })
  }

  async crearControl(){
    let estado;
    let estadoName;
    if(this.objMercadoPago.status === 'pending') estado = 1;
    if(this.objMercadoPago.status === 'approved') estado = 2;
    if(!estado) estado = 3;
    switch (estado) {
      case 1:
        estadoName ="Pendiente";
        break;
      case 2:
        estadoName ="Transmitido";
        break;
      case 3:
        estadoName ="Error";
        break;
      default:
        break;
    }
    this.idUser = this.sharedSvc.obtenerIdUserAction();
    const obj = {
      idMonitorAndControl : 1,
      consecutiveOwn: String(this.objMercadoPago.id),
      idAppointment: this.objMercadoPago.externalReference,
      idStatus: estado,
      idUser: this.idUser,      
      statusName: estadoName,
      APIManagement:"Mercado Pago",
      idProcess: 5
    }
    await lastValueFrom(this.monitorService.crearMonitorPagos(obj)).then(x => {
      if( this.noLogged){
        setTimeout(() => {
          sessionStorage.clear();
        }, 5000);
      }
    })
  }

  construirCuadros() {

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;


    let numeroInicial = 0;
    let cantidad = 0;
    let bordeDivisor = 8
    if (screenWidth > 1500) {
      numeroInicial = 30;
      cantidad = 12;
      bordeDivisor = 8
    }
    else if (screenWidth > 1200) {
      numeroInicial = 16;
      cantidad = 12;
      bordeDivisor = 8
    } else if (screenWidth > 800) {
      numeroInicial = 8;
      cantidad = 12;
      bordeDivisor = 8;
    } else {
      numeroInicial = 5;
      cantidad = 12;
      //  bordeDivisor = 2;
    }

    let numeroY =  screenHeight > 650 ? 7 : 10;
    let numerox = numeroInicial;
    let cuadros = [];
    let i = 0;
    let reduccion = numeroInicial / cantidad;

    while (i < numeroY) {
      cuadros.push({
        ancho: numerox,
        alto: numerox,
        borde: Math.floor(Math.random() * bordeDivisor) + 1
      });
      numerox -= reduccion;
      if (numerox <= 0) {
        i++;
        numerox = numeroInicial;
      }
    }

    this.cuadros = cuadros;
    this.cuadrosInversa = cuadros.slice().reverse();
  }

  redireccion(num :number){
    if(num === 1){
      this.router.navigateByUrl('/inicio');
    }else{
      this.router.navigateByUrl('/inicio/agenda-general/agendamiento');
    }
  }
  
}
