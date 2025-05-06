import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { TablaComunComponent } from '../../../../../shared/tabla/tabla-comun/tabla-comun.component';
import { MatIcon } from '@angular/material/icon';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { SedesService } from '../../../../../services/sedes/sedes.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { Sede, SedeStatus } from '../../../../../shared/interfaces/sedes/sedes.model';
import { lastValueFrom } from 'rxjs';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-sedes-list',
  standalone: true,
  imports: [TablaComunComponent, MatIcon, ReactiveFormsModule, BasicInputComponent, RouterLink],
  templateUrl: './sedes-list.component.html',
  styleUrl: './sedes-list.component.scss'
})
export class SedesListComponent {

  permisosDelModulo: any

  cabeceros: string[] = ['Código', 'Nombre de la sede', 'Dirección', 'Cuidad', 'Estado', 'Editar', 'Eliminar'];
  sedes: any[] = [];
  sedesCopy: Sede[] = [];

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  formSearch = this.fb.group({
    search: [''],
  })

  paginadorNumber : number = 1;
  constructor(private tzs: TrazabilidadService, private shadedSVC: SharedService, private fb: FormBuilder, private router: Router, private loaderSvc: LoaderService,
    private sedesSvc: SedesService, private modalService: ModalService, private elRef : ElementRef, private renderer : Renderer2
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Roles y permisos')
  }

  async ngOnInit(): Promise<void> {
    this.filterSearch();
    await this.getSedes();
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  private ajustarAlto() {

    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const contenedor = this.elRef.nativeElement.querySelector('.titulo').offsetHeight;
    const form = this.elRef.nativeElement.querySelector('.contenedor1').offsetHeight;

    let he = container - contenedor - form - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.table-cont'), 'height', `${he}px`);

    if(he > 50){
      let paginador = he / 30;
      this.paginadorNumber = Math.floor(paginador / 2);
    }else{
      this.paginadorNumber  = 1
    }

  }

  trazabilidad(antes:Sede,despues:Sede | null,idMovimiento:number,movimiento:string){
    const dataTrazabilidad:dataTrazabilidad= {
        datos_actuales: antes,
        datos_actualizados: despues,
        idModulo: 7,
        idMovimiento,
        modulo: "Administración",
        movimiento,
        subModulo: "Sedes"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  filterSearch() {
    this.formSearch.get('search')?.valueChanges.subscribe(e => {
      let data = this.sedesCopy
      if (e) {

        let word = e.toLowerCase().trim();
        data = data.filter(sede => sede.attentionCenterCode.toLowerCase().includes(word.trim())
          || sede.attentionCenterName.toLowerCase().includes(word.trim()) || sede.address.toLowerCase().includes(word.trim()));
        if (data.length) {
          this.mapearTabla(data);
        }
      } else {
        this.mapearTabla(this.sedesCopy);
      }
    })
  }

  async getSedes() {
    try {

      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando sedes' })
      let items = await lastValueFrom(this.sedesSvc.getSedesList());
      if (items.data) {
        this.formSearch.get('search')?.setValue('');
        this.sedesCopy = items.data;
        this.mapearTabla(items.data);
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }


  mapearTabla(items: any[]) {

    this.sedes = items.map((rol: any) => ({
      item1: rol.attentionCenterCode,
      item2: rol.attentionCenterName,
      item3: rol.address,
      item4: rol.cityName,
      item5: rol,   /*Editar*/
      item6: rol, /*Estado*/
      item7: rol  /*Eliminar*/
    }));
  }




  editSede(event: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')

      return
    }
    this.router.navigate(['/inicio/administracion/sedes/form/', event.idAttentionCenter]);
  }

  async eliminarSede(event: any) {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '4')

      return
    }
    let nuevoEvent :Sede = JSON.parse(JSON.stringify(event));
    nuevoEvent.fullNameUserAction = this.nombreUsuario;
    nuevoEvent.idUserAction = this.idUser;
    let idAttentionCenter = event.idAttentionCenter
    if (idAttentionCenter) {
      try {
        this.loaderSvc.show();
        let r = await lastValueFrom(this.sedesSvc.deleteSede(idAttentionCenter));
        this.loaderSvc.hide();
        if (r) {
          this.modalService.openStatusMessage('Aceptar', `Sede eliminada correctamente`, "1")
          this.trazabilidad(nuevoEvent,null,3,'Eliminación');
          await this.getSedes();
        }
      } catch (error) {
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al eliminar la sede, intente de nuevo`, "4")
        this.loaderSvc.hide();

      }
    }
  }


  async cambiarEstado(event: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.getSedes()
      return
    }
    let obj: SedeStatus = {
      id: event[0].item5.idAttentionCenter,
      status: event[1],
      idUserAction: this.shadedSVC.obtenerIdUserAction()
    }
    let antes :Sede = JSON.parse(JSON.stringify(event[0].item5));
    let despues :Sede = JSON.parse(JSON.stringify(event[0].item5));
    despues.active= event[1];
    despues.fullNameUserAction = this.nombreUsuario;
    despues.idUserAction = this.idUser;

    try {
      this.loaderSvc.show();
      let r = await lastValueFrom(this.sedesSvc.changeStatusSede(obj));
      this.loaderSvc.hide();
      if (r.ok) {
        this.trazabilidad(antes,despues,2,'Edición');
        let status = this.sedes.find(s => s.item5.idAttentionCenter == event[0].item5.idAttentionCenter)
        if(status) status.item5.active = event[1]
        this.modalService.openStatusMessage('Aceptar', `Sede ${obj.status ? 'activada' : 'desactivada'} correctamente`, "1")
      } else {
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${obj.status ? 'activar' : 'desactivar'} la sede, intente de nuevo`, "4")
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${obj.status ? 'activar' : 'desactivar'} la sede, intente de nuevo`, "4")
      this.loaderSvc.hide();

    }
  }




}
