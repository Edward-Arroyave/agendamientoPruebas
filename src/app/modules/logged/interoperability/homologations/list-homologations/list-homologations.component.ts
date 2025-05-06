import { Component, ElementRef, HostListener, Renderer2, TemplateRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { HomologationsService } from '@app/services/interoperability/homologations/homologations.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '@app/shared/inputs/toggle/toggle.component';
import { ChangeStatusHomologation, Homologation, HomologationsByNamePage } from '@app/shared/interfaces/interoperability/homologations.model';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { debounceTime, distinctUntilChanged, lastValueFrom, Subject, switchMap, takeUntil } from 'rxjs';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-list-homologations',
  standalone: true,
  imports: [ToggleComponent, MatTooltipModule, MatIcon, BasicInputComponent, RouterLink, NgxPaginationModule],
  templateUrl: './list-homologations.component.html',
  styleUrl: './list-homologations.component.scss'
})
export class ListHomologationsComponent {
  permisosDelModulo: any
  cabeceros: string[] = ['Integración', 'Diccionario de datos', 'Id diccionario', 'Código externo', 'Descripción', 'Estado', 'Editar', 'Eliminar'];
  formSearch = this.fb.group({
    search: [''],
  })

  data: any[] = [];

  pageSize: number = 5;
  pageNumber: number = 0;
  currentPage: number = 1;
  counter: number = 0;
  paginadorNumber: number = 1;

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();



  constructor(private tzs: TrazabilidadService, private shadedSVC: SharedService, private fb: FormBuilder, private router: Router, private loaderSvc: LoaderService,
    private modalService: ModalService, private elRef: ElementRef, private renderer: Renderer2, private dialog: MatDialog, private homologationsSvc: HomologationsService
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Homologación')
  }


  async ngOnInit(): Promise<void> {
    this.filterSearch();
    this.ajustarAlto()
    await this.getHomologationList(this.currentPage);

  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    this.currentPage = 1;
    setTimeout(() => {
      this.ajustarAlto()
      setTimeout(async () => {
        await this.getHomologationList(this.currentPage);
      }, 100);
    }, 100)
  }


  filterSearch() {
    this.formSearch.get('search')?.valueChanges
      .pipe(
        debounceTime(600), // Espera 600ms después del último cambio
        distinctUntilChanged(), // Evita ejecutar para valores iguales consecutivos
        switchMap(e => {
          if (e && e.length > 3) {
            return this.getHomologationList();
          } else {
            return this.getHomologationList();
          }
          return [];
        })
      )
      .subscribe();
  }

  async ajustarAlto() {

    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const titulo = this.elRef.nativeElement.querySelector('.titulo').offsetHeight;
    const searchLoad = this.elRef.nativeElement.querySelector('.form-search').offsetHeight;
    let he = container - titulo - searchLoad - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.contenedor-tabla'), 'height', `${he}px`);
    let paginador = he / 25;
    let paginas = Math.floor(paginador / 2);
    this.pageSize = paginas > 5 ? paginas : 5

  }

  async getHomologationList(pageNumber?: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando homologaciones' })
      let nameCodeSearch = this.formSearch.get('search')?.value || '';

      let objectPaginator: HomologationsByNamePage = {
        nameCodeSearch,
        idIntegration: 0,
        idDataDictionary: 0,
        idHomologation: 0,
        pageSize: this.pageSize,
        pageNumber: pageNumber || 1
      }
      if (!pageNumber) this.currentPage = 1;
      let i = await lastValueFrom(this.homologationsSvc.getHomologations(objectPaginator));
      this.loaderSvc.hide()
      if (i.ok && i.data) {
        this.counter = i.data.RegistrosTotales;
        this.data = i.data.Homologaciones.slice(0, this.pageSize);
      } else {
        this.modalService.openStatusMessage('Aceptar', 'No se encontraron homologaciones relacionadas', '3')
        this.data = []
        this.currentPage = 1;
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer las homologaciones', '4')
      this.loaderSvc.hide()
    }
  }

  async changeStatus(event: any, idHomologation: number) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      await this.getHomologationList();
      return
    }
    let obj: ChangeStatusHomologation = {
      idEntitie: idHomologation,
      active: event,
      idUserAction: this.shadedSVC.obtenerIdUserAction()
    }

    let item = this.data.find(e => e.idHomologation == idHomologation);

    try {
      this.loaderSvc.show();
      let r: any = await lastValueFrom(this.homologationsSvc.changeStatusHomologation(obj));
      this.loaderSvc.hide();
      if (r.ok) {
        //----------Trazabilidad----------///
        let item = this.data.find(e => e.idHomologation == idHomologation);
        let objAnterior: Homologation = JSON.parse(JSON.stringify(item));
        let antes: Homologation = {
          idHomologation: objAnterior.idDataDictionary,
          ownCode: objAnterior.ownCode,
          externalCode: objAnterior.externalCode,
          idIntegrations: objAnterior.idIntegrations,
          integrationsName: objAnterior.integrationsName,
          dictionaryName: objAnterior.dictionaryName,
          idDataDictionary: objAnterior.idDataDictionary,
          descriptions: objAnterior.descriptions,
          active: objAnterior.active,
          fullNameUserAction: objAnterior.fullNameUserAction,
          idUserAction: objAnterior.idUserAction,
        };

        let despues: Homologation = JSON.parse(JSON.stringify(antes));
        despues.active = event;
        despues.fullNameUserAction = this.nombreUsuario;
        despues.idUserAction = this.idUser;
        this.trazabilidad(antes, despues, 2, 'Edición');

        //---------- Fin Trazabilidad----------///
        this.modalService.openStatusMessage('Aceptar', `Homologacion ${obj.active ? 'activada' : 'desactivada'} correctamente en el sistema`, "1")
      } else {
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${obj.active ? 'activar' : 'desactivar'} la homologacion, intente de nuevo`, "4")
        this.getHomologationList(this.currentPage);
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${obj.active ? 'activar' : 'desactivar'} la homologacion, intente de nuevo`, "4")
      this.loaderSvc.hide();

    }
  }

  editHomologation(idDictionary: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '3');
      return
    }
    this.router.navigate(['/inicio/interoperabilidad/homologaciones/form/', idDictionary]);
  }



  openModalDelete(template: TemplateRef<any>, item: any, titulo: string = '', mensaje: string = '') {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '3');
      return
    }

    titulo = `¿Está seguro que desea eliminar la homologacion seleccionada?`
    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: 'Cerrar',
      footer: true,
      title: titulo,
      type: '2',
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async x => {
      await this.deleteHomologation(item.idHomologation)
      dialogRef.close();

    });
  }


  async deleteHomologation(idHomologation: any) {
    try {
      this.loaderSvc.show();
      let r = await lastValueFrom(this.homologationsSvc.deleteHomologations(idHomologation));
      this.loaderSvc.hide();

      if (r.ok) {
        //----------Trazabilidad----------///
        let item = this.data.find(e => e.idHomologation == idHomologation);
        let objAnterior: Homologation = JSON.parse(JSON.stringify(item));
        let nuevoEvent: Homologation = {
          idHomologation: objAnterior.idDataDictionary,
          ownCode: objAnterior.ownCode,
          externalCode: objAnterior.externalCode,
          idIntegrations: objAnterior.idIntegrations,
          integrationsName: objAnterior.integrationsName,
          dictionaryName: objAnterior.dictionaryName,
          idDataDictionary: objAnterior.idDataDictionary,
          descriptions: objAnterior.descriptions,
          active: objAnterior.active,
        };

        nuevoEvent.idUserAction = this.idUser;
        nuevoEvent.fullNameUserAction = this.nombreUsuario;
        this.trazabilidad(nuevoEvent, null, 3, 'Eliminación');

        //---------- Fin Trazabilidad----------///
        this.modalService.openStatusMessage('Aceptar', `Homologación eliminada correctamente en el sistema`, "1");
        await this.getHomologationList();
      } else {
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al eliminar la homologación, intente de nuevo`, "4")

      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al eliminar la homologación, intente de nuevo`, "4")
      this.loaderSvc.hide();

    }

  }

  trazabilidad(antes: Homologation, despues: Homologation | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 24,
      idMovimiento,
      modulo: "Homologación",
      movimiento,
      subModulo: "Homologaciones"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }


  handlePageChange(page: any) {
    this.currentPage = page;
    this.getHomologationList(page)
  }
}
