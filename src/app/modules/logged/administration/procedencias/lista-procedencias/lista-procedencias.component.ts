import { Component, ElementRef, HostListener, OnInit, Renderer2, signal, TemplateRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcedenciasService } from '@app/services/administracion/procedencias/procedencias.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { IProcedencia } from '@app/shared/interfaces/procedencias/procedencias.model';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { TablaComunComponent } from '@app/shared/tabla/tabla-comun/tabla-comun.component';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-lista-procedencias',
  standalone: true,
  imports: [TablaComunComponent, MatIcon, ReactiveFormsModule, BasicInputComponent],
  templateUrl: './lista-procedencias.component.html',
  styleUrl: './lista-procedencias.component.scss'
})
export class ListaProcedenciasComponent implements OnInit {

  permisosDelModulo: any;

  formularioBusqueda = this.fb.group({
    procedencia: [''],
    entidades: [''],
  })

  cabeceros: string[] = ['Nombre de la procedencia', 'Nombre de la entidad', 'Descripción', 'Estado', 'Editar', 'Eliminar'];
  registros: any[] = [];
  registrosTabla = signal<any[]>([]);
  descripcionEntidad = signal<string>('');

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  constructor(
    private shadedSVC: SharedService,
    private tzs: TrazabilidadService,
    private fb: FormBuilder,
    private procedenciasService: ProcedenciasService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    private dialog: MatDialog,
    private loaderService: LoaderService,
    private elRef : ElementRef, private renderer : Renderer2
  ) { }

  ngOnInit(): void {
    this.buscar();
    this.permisosDelModulo = this.shadedSVC.obtenerPermisosModulo('Procedencias y entidades');
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  paginadorNumber: number = 1;

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  private ajustarAlto() {

    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const contenedor = this.elRef.nativeElement.querySelector('.titulo').offsetHeight;
    const form = this.elRef.nativeElement.querySelector('.contenedor1').offsetHeight;

    let he = container - contenedor - form - 100;
   // this.renderer.setStyle(this.elRef.nativeElement.querySelector('.table-cont'), 'height', `${he}px`);

    if(he > 50){
      let paginador = he / 30;
      this.paginadorNumber = Math.floor(paginador / 2);
    }else{
      this.paginadorNumber  = 1
    }

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


  async buscar() {
    try {
      this.loaderService.show();
      this.loaderService.text.set({ text: 'Cargando información' });
      const request = {
        origin: this.formularioBusqueda.value.procedencia,
        entity: this.formularioBusqueda.value.entidades,
      };

      const respuesta = await firstValueFrom(this.procedenciasService.getListEntities(request));

      if (!respuesta.ok) {
        this.loaderService.hide();
        this.modalService.openStatusMessage('Aceptar', 'No se pudo recuperar la información', '4');
        return;
      }

      this.registros = respuesta.data;
      this.registrosTabla.set(this.mapearRegistrosTabla());
      this.loaderService.hide();
    } catch (error) {
      this.loaderService.hide();
      console.error("Error: ", error);
    }
  }

  limpiarFiltro() {
    this.formularioBusqueda.patchValue({
      procedencia: '',
      entidades: '',
    });
    this.buscar();
  }

  mapearRegistrosTabla() {
     const datosTabla = this.registros.map((registro: any) => ({
      item1: registro.origin,
      item2: registro.entity,
      item3: registro,
      item4: registro,
      item5: registro,
    }));
    return datosTabla;
  }

  async cambiarEstado(data: any) {

    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
      this.buscar();
      return
    }

    try {

      this.loaderService.show();
      this.loaderService.text.set({ text: 'Actualizando registro' });

      // Recuperar datos de la entidad
      const entidad = data[0]?.item5;
      const estado = data[1];

      const request = {
        idEntitie: entidad.idOriginEntity,
        active: estado,
      };

      let antes :IProcedencia = JSON.parse(JSON.stringify(data[0].item5));
      let despues :IProcedencia = JSON.parse(JSON.stringify(data[0].item5));
      antes.entityName = antes.entity;
      despues.entityName = despues.entity;
      despues.active= estado;
      despues.fullNameUserAction = this.nombreUsuario;
      despues.idUserAction = this.idUser;
      const respuesta = await firstValueFrom(this.procedenciasService.updateEntityStatus(request));

      if (!respuesta.ok) {
        // Mantener el esado inicial del registro
        this.registrosTabla.set(this.mapearRegistrosTabla());
        this.modalService.openStatusMessage('Aceptar', 'No se pudo eliminar el registro', '4');
      }
      this.buscar();
      this.trazabilidad(antes,despues,2,'Edición');
      this.loaderService.hide();
    } catch (error) {
      this.loaderService.hide();
      this.modalService.openStatusMessage('Aceptar', 'No se pudo eliminar el registro', '4');
      console.error("Error: ", error);
    }
  }

  agregar() {
    if (!this.permisosDelModulo.Crear) return this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para crear', '4');
    this.router.navigate(['./form' ], { relativeTo: this.route });
  }

  editar(entidad: any) {
    if (!this.permisosDelModulo.Editar) return this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
    this.router.navigate(['./form', entidad.idOriginEntity ], { relativeTo: this.route });
  }

  async eliminar(entidad: any) {
    if (!this.permisosDelModulo.Eliminar) return this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '4');
    try {
      this.loaderService.show();
      this.loaderService.text.set({ text: 'Eliminando registro' });
      let nuevoEntidad :IProcedencia = JSON.parse(JSON.stringify(entidad));
      nuevoEntidad.fullNameUserAction = this.nombreUsuario;
      nuevoEntidad.idUserAction = this.idUser;

      const respuesta = await firstValueFrom(this.procedenciasService.deleteEntity(entidad.idOriginEntity));

      if (!respuesta.ok) {
        this.modalService.openStatusMessage('Aceptar', 'No se pudo eliminar el registro', '4');
        return;
      }

      nuevoEntidad.entityName = "Entidad" + nuevoEntidad.entity;
      nuevoEntidad = {
        ...nuevoEntidad,
        entityName :nuevoEntidad.entity
      }
      // Eliminar el registro con base al ID
      this.trazabilidad(nuevoEntidad,null,3,'Eliminación');
      this.registros = this.registros.filter((registro: any) => registro.idOriginEntity !== entidad.idOriginEntity);
      this.registrosTabla.set(this.mapearRegistrosTabla());

      this.loaderService.hide();
    } catch (error) {
      this.loaderService.hide();
      this.modalService.openStatusMessage('Aceptar', 'No se pudo eliminar el registro', '4');
      console.error("Error: ", error);
    }
  }

  abrirDescripcion(template: TemplateRef<any>, entidad: any) {
    this.descripcionEntidad.set(entidad.item4.description);

    const destroy$: Subject<boolean> = new Subject<boolean>();
    const data: ModalData = {
      content: template,
      btn: 'Cerrar',
      footer: true,
      type: '',
    };

    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '70em', data, disableClose: true });

    // BTN CERRAR
    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      dialogRef.close();
    });
  }
}

