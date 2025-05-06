import { Location } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProcedenciasService } from '@app/services/administracion/procedencias/procedencias.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '@app/shared/inputs/toggle/toggle.component';
import { IProcedencia } from '@app/shared/interfaces/procedencias/procedencias.model';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-form-procedencia',
  standalone: true,
  imports: [ReactiveFormsModule, BasicInputComponent, ToggleComponent, RouterLink],
  templateUrl: './formulario-procedencia.component.html',
  styleUrl: './formulario-procedencia.component.scss'
})
export class FormularioProcedenciaComponent implements OnInit {
  @Input() idProcedencia?: number = 0;

  permisosDelModulo: any;

  detalleEntidad!: IProcedencia;
  cargaCompleta: boolean = false;

  formulario = this.fb.group({
    procedencia: ['', [Validators.required]],
    entidad: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    cargueAutorizacion: [false],
    fechaAutorizacion: [false],
    vencimientoAutorizacion: [''],
    cargueOrden: [false],
    fechaOrden: [false],
    vencimientoOrden: ['',],
    cargueHistoria: [false],
    fechaHistoria: [false],
    vencimientoHistoria: [''],
  });

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();

  constructor(
    private tzs: TrazabilidadService,
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private procedenciaService: ProcedenciasService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    private shadedSVC: SharedService,
  ) { }

  ngOnInit(): void {
    if (this.idProcedencia && this.idProcedencia > 0) this.obtenerDetalle();
    else this.cargaCompleta = true; // Habilitar visual de controles.
    this.permisosDelModulo = this.shadedSVC.obtenerPermisosModulo('Procedencias y entidades');
  }

  trazabilidad(antes:IProcedencia,despues:IProcedencia | null,idMovimiento:number,movimiento:string){
    const dataTrazabilidad:dataTrazabilidad= {
        datos_actuales: antes,
        datos_actualizados: despues,
        idModulo: 7,
        idMovimiento,
        modulo: "Administración",
        movimiento,
        subModulo: "Procedencias y entidades"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  async guardar() {

    try {
      // recuperar los datos del formulario y mapearla a la interfaz
      let flagPermiso:boolean = true;
      const datos = this.formulario.value;
      const request: IProcedencia = {
        idOriginEntity: !!this.idProcedencia ? Number(this.idProcedencia) : 0,
        origin: String(datos.procedencia),
        entityName: datos.entidad || '',
        description: datos.descripcion || '',
        authorizationExpiration: datos.vencimientoAutorizacion || '',
        medicalOrderExpiration: datos.vencimientoOrden || '',
        medicalHistoryExpiration: datos.vencimientoHistoria || '',
        medicalAuthorization: datos.cargueAutorizacion ?? false,
        medicalOrder: datos.cargueOrden ?? false,
        medicalHistory: datos.cargueHistoria ?? false,
        authorizationDate: datos.fechaAutorizacion ?? false,
        medicalOrderDate: datos.fechaOrden ?? false,
        medicalHistoryDate: datos.fechaHistoria ?? false
      };

      if(request.idOriginEntity === 0){
        if (!this.permisosDelModulo.Crear) {
          this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para crear', '4');
          flagPermiso = false;
          return
        }
      }else{
        if (!this.permisosDelModulo.Editar) {
          this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para Editar', '4');
          flagPermiso = false;
          return
        }
      }

      if (!flagPermiso) return

      this.formulario.markAllAsTouched();
      if (this.formulario.invalid) {
        if ((request.authorizationDate && !request.authorizationExpiration) ||
            (request.medicalOrderDate && !request.medicalOrderExpiration) ||
            (request.medicalHistoryDate && !request.medicalHistoryExpiration)
        ){
          this.modalService.openStatusMessage('Aceptar', 'Debe ingresar el tiempo de vencimiento', '4');
        }
        return;
      }
      this.loaderService.show();
      this.loaderService.text.set({ text: 'Guardando información' });
      const respuesta = await firstValueFrom(this.procedenciaService.saveEntity(request));
      this.loaderService.hide();
      if (!respuesta?.ok) {
        this.modalService.openStatusMessage('Aceptar', 'No se pudo guardar la información', '4');
        return;
      }

      const mensaje = `!Procedencia y entidad ${!!this.idProcedencia ? 'actualizadas en el' : 'agregadas al'} sistema correctamente!`;
      this.modalService.openStatusMessage('Aceptar', mensaje, '1');

      if(!!this.idProcedencia ){
        const nuevoEntidad = {
          ...request,
          idUserAction: this.shadedSVC.obtenerIdUserAction(),
          fullNameUserAction : this.nombreUsuario,
          active:this.detalleEntidad.active,
          entity:request.entityName
        }
        this.detalleEntidad.entity =request.entityName;
        this.trazabilidad(this.detalleEntidad,nuevoEntidad,2,'Edición');
      }else{
        const nuevoEntidad = {
          ...request,
          idUserAction: this.shadedSVC.obtenerIdUserAction(),
          fullNameUserAction :this.nombreUsuario,
          entity:request.entityName,
          active:true
        }
        this.trazabilidad(nuevoEntidad,null,1,'Creación');
      }
      this.loaderService.hide();
      this.router.navigate([this.idProcedencia ? '../../procedencia' : '../procedencia'], { relativeTo: this.route });
    } catch (error) {
      this.loaderService.hide();
    }
  }

  async obtenerDetalle() {
    const notificacionError: any = () => {
      this.loaderService.hide();
      this.modalService.openStatusMessage('Aceptar', 'No se pudo recuperar la información', '4');
      this.router.navigate(['../../procedencia'], { relativeTo: this.route });
    };

    try {
      this.loaderService.show();
      this.loaderService.text.set({ text: 'Cargando datos' });

      const respuesta = await firstValueFrom(this.procedenciaService.getDetailEntity(this.idProcedencia));

      if (!respuesta?.ok) {
        notificacionError();
        return;
      };

      // Cargar información.
      this.detalleEntidad = JSON.parse(JSON.stringify(respuesta.data));
      this.formulario.patchValue({
        procedencia: this.detalleEntidad.origin,
        entidad: this.detalleEntidad.entityName,
        descripcion: this.detalleEntidad.description,
        cargueAutorizacion: this.detalleEntidad.medicalAuthorization,
        fechaAutorizacion: this.detalleEntidad.authorizationDate,
        vencimientoAutorizacion: this.detalleEntidad.authorizationExpiration,
        cargueOrden: this.detalleEntidad.medicalOrder,
        fechaOrden: this.detalleEntidad.medicalOrderDate,
        vencimientoOrden: this.detalleEntidad.medicalOrderExpiration,
        cargueHistoria: this.detalleEntidad.medicalHistory,
        fechaHistoria: this.detalleEntidad.medicalHistoryDate,
        vencimientoHistoria: this.detalleEntidad.medicalHistoryExpiration,
      });

      this.validadorVencimiento();
      this.cargaCompleta = true; // Habilitar visual de controles.

      this.loaderService.hide();

    } catch (error) {
      notificacionError();
    }
  }

  validadorVencimiento() {
    const vencimientoAutorizacion = this.formulario.get('vencimientoAutorizacion');
    if (this.formulario.get('fechaAutorizacion')?.value) {
      vencimientoAutorizacion?.setValidators([Validators.required]);
      vencimientoAutorizacion?.enable();
    } else {
      vencimientoAutorizacion?.reset();
      vencimientoAutorizacion?.clearValidators();
      vencimientoAutorizacion?.disable();
    }
    vencimientoAutorizacion?.updateValueAndValidity();

    const vencimientoOrden = this.formulario.get('vencimientoOrden');
    if (this.formulario.get('fechaOrden')?.value) {
      vencimientoOrden?.setValidators([Validators.required]);
      vencimientoOrden?.enable();
    } else {
      vencimientoOrden?.reset();
      vencimientoOrden?.clearValidators();
      vencimientoOrden?.disable();
    }
    vencimientoOrden?.updateValueAndValidity();

    const vencimientoHistoria = this.formulario.get('vencimientoHistoria');
    if (this.formulario.get('fechaHistoria')?.value) {
      vencimientoHistoria?.setValidators([Validators.required]);
      vencimientoHistoria?.enable();
    } else {
      vencimientoHistoria?.reset();
      vencimientoHistoria?.clearValidators();
      vencimientoHistoria?.disable();
    }
    vencimientoHistoria?.updateValueAndValidity();
  }

  cambiarEstado(control: string, estado: boolean) {
    this.formulario.get(control)?.setValue(estado);
    this.validadorVencimiento();
  }
}
