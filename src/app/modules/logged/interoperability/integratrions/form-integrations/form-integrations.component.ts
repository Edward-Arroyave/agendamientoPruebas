import { lastValueFrom } from 'rxjs';
import { Component, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IntegrationsService } from '@app/services/interoperability/integrations/integrations.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { Integration, IntegrationsByNamePage } from '@app/shared/interfaces/interoperability/integrations-model';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-form-integrations',
  standalone: true,
  imports: [BasicInputComponent],
  templateUrl: './form-integrations.component.html',
  styleUrl: './form-integrations.component.scss'
})
export class FormIntegrationsComponent {
  idIntegration: number | undefined = undefined;
  formIntegration = this.fb.group({
    integrationsCode: ['', [Validators.required]],
    integrationsName: ['', [Validators.required]],
  });

  permisosDelModulo: any
  currentIntegration: Integration | undefined

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  constructor(
    private actRoute: ActivatedRoute,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private shadedSVC: SharedService,
    private loaderSvc: LoaderService,
    private modalService: ModalService,
    private fb: FormBuilder,
    private tzs: TrazabilidadService,
    private integrationsvc: IntegrationsService,
  ) {
    this.actRoute.params.subscribe(params => {
      this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Integraciones')
      let idIntegration = params['idIntegration'];
      if (idIntegration) {
        this.idIntegration = Number(idIntegration);
        if (!this.permisosDelModulo.Editar) {
          this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
          this.cancel()
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.getInfoIntegration();
  }

  async getInfoIntegration() {
    if (this.idIntegration) {
      let objectPaginator: IntegrationsByNamePage = {
        nameCode: '',
        pageSize: 1,
        pageNumber: 1,
        idEntity: this.idIntegration
      }

      try {
        this.loaderSvc.show();
        this.loaderSvc.text.set({text:'Cargando integración'});
        let i: any = await lastValueFrom(this.integrationsvc.getIntegrations(objectPaginator));
        this.loaderSvc.hide();
        if (i.ok && i.data) {
          this.currentIntegration = i.data.Integraciones[0];
          this.formIntegration.get('integrationsCode')?.setValue(i.data.Integraciones[0].integrationsCode);
          this.formIntegration.get('integrationsName')?.setValue(i.data.Integraciones[0].integrationsName);
        } else {
          this.modalService.openStatusMessage('Aceptar', 'No se encontro integración', '4')
          this.currentIntegration = undefined
        }
      } catch (error) {
        this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error la integración', '4')

        this.loaderSvc.hide()
      }
    }

  }



  cancel() {
    this.router.navigate(['/inicio/interoperabilidad/integraciones'])
  }

  async saveOrUpdate() {

    if (this.formIntegration.invalid) {
      this.formIntegration.markAllAsTouched();
      return
    }

    let obj: Integration = {
      idIntegrations: this.idIntegration || 0,
      integrationsName: this.formIntegration.get('integrationsName')?.value || '',
      integrationsCode: this.formIntegration.get('integrationsCode')?.value || '',
      idUserAction: this.idUser
    }
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Guardando integración' })
      let r = await lastValueFrom(this.integrationsvc.createOrEditIntegration(obj))
      if (r.ok) {
        this.trazabilitySaveOrEdit(obj);
        this.modalService.openStatusMessage('Aceptar', `Integración ${this.idIntegration ? 'actualizada' : 'guardada'} correctamente en el sistema`, '1');
        this.cancel();
      } else {
        this.modalService.openStatusMessage('Aceptar', r.message, '4');
      }
      this.loaderSvc.hide();
    } catch (error) {
      console.error(error);
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al guardar la integración', '4');
    }


  }



  trazabilitySaveOrEdit(objetSending: any) {
    let antes;
    let despues;
    if (this.idIntegration) {
      let objAnterior: Integration = JSON.parse(JSON.stringify(this.currentIntegration));
      const nuevoObj = {
        ...objetSending,
        fullNameUserAction: this.nombreUsuario,
        active: objAnterior.active
      };
      antes = {
        idIntegrations: objAnterior.idIntegrations,
        integrationsName: objAnterior.integrationsName,
        integrationsCode: objAnterior.integrationsCode,
        active: objAnterior.active,
        fullNameUserAction: objAnterior.fullNameUserAction,
        idUserAction: objAnterior.idUserAction,
      };
      despues = JSON.parse(JSON.stringify(nuevoObj));
      despues.idUserAction = this.idUser;


    } else {
      const nuevoObj = {
        ...objetSending,
        fullNameUserAction: this.nombreUsuario,
      };
      antes = JSON.parse(JSON.stringify(nuevoObj));
    }

    this.idIntegration ? this.trazabilidad(antes, despues, 2, 'Edición') : this.trazabilidad(antes, null, 1, 'Creación');
  }


  trazabilidad(antes: Integration, despues: Integration | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 24,
      idMovimiento,
      modulo: "Homologación",
      movimiento,
      subModulo: "Integraciones"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

}
