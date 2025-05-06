import { JsonPipe } from '@angular/common';
import { IpaymentGateway } from './../../../../../shared/interfaces/payment-gateway/payment-gateway.model';
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { PaymentGatewayService } from '@app/services/payment-gateway/payment-gateway.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { passwordValidator } from '@app/shared/globales/Validator/passValidator';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-form-payment-gateway',
  standalone: true,
  imports: [BasicInputComponent],
  templateUrl: './form-payment-gateway.component.html',
  styleUrl: './form-payment-gateway.component.scss'
})
export class FormPaymentGatewayComponent {

  permisosDelModulo: any

  idPaymentGateway: number = 0
  isEdit: boolean = false

  times: any[] = []

  formulario = this.fb.group({
    urlService: [''],
    userName: [''],
    password: [''],
    amountOfTime: ['', [Validators.required]],
    idUnitOfTime: ['', [Validators.required]],
    nameParticularContract: ['', [Validators.required]],
    particularContractCode: ['', [Validators.required]],
  },
  );
  passwordLoad = false;

  constructor(
    private tzs: TrazabilidadService,
    private fb: FormBuilder, private router: Router,
    private loaderSvc: LoaderService,
    private shadedSVC: SharedService,
    private modalService: ModalService,
    private ActivRoute: ActivatedRoute,
    private paymentSvc: PaymentGatewayService
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Pasarela de pagos')
    this.ActivRoute.params.subscribe(params => {

      let idPaymentGateway = params['idPaymentGateway'];
      if (idPaymentGateway) {
        this.idPaymentGateway = Number(idPaymentGateway);
        this.isEdit = true;
        if (!this.permisosDelModulo.Editar) {
          this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
          this.cancel()
        }
      }
    });
  }


  async ngOnInit(): Promise<void> {
    await this.getTimesOfPayment()
    await this.getPaymentsConfigured();

    setTimeout(() => {
      this.passwordLoad = true;
    }, 100);
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

  async getPaymentsConfigured() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando configuración' })
      let p = await lastValueFrom(this.paymentSvc.paymentGateway());
      if (p.data) {
        this.formulario.patchValue(p.data)
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }



  cancel() {
    this.router.navigate(['/inicio/administracion/gateway'])
  }


  async createOrEdit() {
    if (this.formulario.valid) {
      try {
        this.loaderSvc.show()
        this.loaderSvc.text.set({ text: 'Guardando configuración' })
        let obj: IpaymentGateway = {
          idPaymentGateway: this.idPaymentGateway || 0,
          urlService: this.formulario.get('urlService')?.value || '',
          userName: this.formulario.get('userName')?.value || '',
          password: this.formulario.get('password')?.value || '',
          idUnitOfTime: Number(this.formulario.get('idUnitOfTime')?.value) || 0,
          amountOfTime: Number(this.formulario.get('amountOfTime')?.value) || 0,
          nameParticularContract: this.formulario.get('nameParticularContract')?.value || '',
          particularContractCode: this.formulario.get('particularContractCode')?.value || '',
        }

        let response = await lastValueFrom(this.paymentSvc.createUpdatePaymentGateway(obj));

        if (response.ok) {
          this.modalService.openStatusMessage('Aceptar', `Pasarela de pagos ${this.idPaymentGateway ? 'actualizada' : 'creada'} en el sistema correctamente`, "1")
          this.cancel();
        } else {
          this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${this.idPaymentGateway ? 'actualizar' : 'crear'} la pasarela de pagos`, "4")
          this.cancel();
        }
        this.loaderSvc.hide();
      } catch (error) {
        console.error(error);
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${this.idPaymentGateway ? 'actualizar' : 'crear'} la pasarela de pagos`, "4");
        this.loaderSvc.hide();
      }

    } else {
      this.formulario.markAllAsTouched();
    }

  }

}
