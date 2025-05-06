import { Component, ElementRef, HostListener, Renderer2, TemplateRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { DictionaryDataService } from '@app/services/interoperability/dictionary-data/dictionary-data.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '@app/shared/inputs/toggle/toggle.component';
import { ChangeStatusDictionary, Dictionary, DictionarysByNamePage } from '@app/shared/interfaces/interoperability/dictorionary-model';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { debounceTime, distinctUntilChanged, lastValueFrom, Subject, switchMap, takeUntil } from 'rxjs';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-list-dictionary',
  standalone: true,
  imports: [ToggleComponent, MatTooltipModule, MatIcon, BasicInputComponent, RouterLink, NgxPaginationModule],
  templateUrl: './list-dictionary.component.html',
  styleUrl: './list-dictionary.component.scss'
})
export class ListDictionaryComponent {

  permisosDelModulo: any
  cabeceros: string[] = ['Código diccionario', 'Diccionario de datos', 'Estado', 'Editar', 'Eliminar'];
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
    private modalService: ModalService, private elRef: ElementRef, private renderer: Renderer2, private dialog: MatDialog, private dictionarySvc: DictionaryDataService
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Diccionario de datos')
  }



  async ngOnInit(): Promise<void> {
    this.filterSearch();
    this.ajustarAlto()
    await this.getDictionaryList(this.currentPage);

  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    this.currentPage = 1;
    setTimeout(() => {
      this.ajustarAlto()
      setTimeout(async () => {
        await this.getDictionaryList(this.currentPage);
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
            return this.getDictionaryList();
          } else {
            return this.getDictionaryList();
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

  async getDictionaryList(pageNumber?: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando diccionarios de datos' })
      let nameCode = this.formSearch.get('search')?.value || '';
      let objectPaginator: DictionarysByNamePage = {
        nameCode,
        idEntity: 0,
        pageSize: this.pageSize,
        pageNumber: pageNumber || 1,
      }
      if (!pageNumber) this.currentPage = 1;
      let i = await lastValueFrom(this.dictionarySvc.getDictionarys(objectPaginator));
      this.loaderSvc.hide()
      if (i.ok && i.data) {
        this.counter = i.data.RegistrosTotales;
        this.data = i.data.DiccionariosDeDatos.slice(0, this.pageSize);
      } else {
        this.modalService.openStatusMessage('Aceptar', 'No se encontraron diccionarios relacionados', '3')
        this.data = []
        this.currentPage = 1;
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer los diccionarios', '4')

      this.loaderSvc.hide()
    }
  }

  async changeStatus(event: any, idDataDictionary: number) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      await this.getDictionaryList();
      return
    }
    let obj: ChangeStatusDictionary = {
      idEntitie: idDataDictionary,
      active: event,
      idUserAction: this.shadedSVC.obtenerIdUserAction()
    }
    try {
      this.loaderSvc.show();
      let r: any = await lastValueFrom(this.dictionarySvc.changeStatusDictionary(obj));
      this.loaderSvc.hide();
      if (r.ok) {
        //----------Trazabilidad----------///
        let item = this.data.find(e => e.idDataDictionary == idDataDictionary);
        let objAnterior: Dictionary = JSON.parse(JSON.stringify(item));
        let antes: Dictionary = {
          idDataDictionary: objAnterior.idDataDictionary,
          dictionaryName: objAnterior.dictionaryName,
          dictionaryCode: objAnterior.dictionaryCode,
          table: objAnterior.table,
          idListOfTables: objAnterior.idListOfTables,
          tablesId: objAnterior.tablesId,
          descriptions: objAnterior.descriptions,
          active: objAnterior.active,
          fullNameUserAction: objAnterior.fullNameUserAction,
          idUserAction: objAnterior.idUserAction,
        };

        let despues: Dictionary = JSON.parse(JSON.stringify(antes));
        despues.active = event;
        despues.fullNameUserAction = this.nombreUsuario;
        despues.idUserAction = this.idUser;
        this.trazabilidad(antes, despues, 2, 'Edición');

        //---------- Fin Trazabilidad----------///
        this.modalService.openStatusMessage('Aceptar', `Diccionario de datos ${obj.active ? 'activado' : 'desactivado'} correctamente en el sistema`, "1")
      } else {
        if (r.message.includes("No se puede cambiar el estado del diccionario de datos")) {
          this.modalService.openStatusMessage('Aceptar', r.message, "4")
        } else {
          this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${obj.active ? 'activar' : 'desactivar'} el diccionario, intente de nuevo`, "4")
        }
      }
      this.getDictionaryList(this.currentPage);
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${obj.active ? 'activar' : 'desactivar'} el diccionario, intente de nuevo`, "4")
      this.loaderSvc.hide();

    }
  }

  editDictionary(idDataDictionary: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '3');
      return
    }
    this.router.navigate(['/inicio/interoperabilidad/diccionario/form/', idDataDictionary]);
  }



  openModalDelete(template: TemplateRef<any>, item: any, titulo: string = '', mensaje: string = '') {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '3');
      return
    }

    titulo = `¿Está seguro que desea eliminar el diccionario seleccionado?`
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
      await this.deleteHomologation(item.idDataDictionary)
      dialogRef.close();

    });
  }


  async deleteHomologation(idDataDictionary: any) {
    try {
      this.loaderSvc.show();
      let r = await lastValueFrom(this.dictionarySvc.deleteDictionary(idDataDictionary));
      this.loaderSvc.hide();
      let elemento = this.data.find(e => e.idDataDictionary == idDataDictionary);

      if (r.ok) {

        //----------Trazabilidad----------///
        let item = this.data.find(e => e.idDataDictionary == idDataDictionary);
        let objAnterior: Dictionary = JSON.parse(JSON.stringify(item));
        let nuevoEvent: Dictionary = {
          idDataDictionary: objAnterior.idDataDictionary,
          dictionaryName: objAnterior.dictionaryName,
          dictionaryCode: objAnterior.dictionaryCode,
          table: objAnterior.table,
          idListOfTables: objAnterior.idListOfTables,
          tablesId: objAnterior.tablesId,
          descriptions: objAnterior.descriptions,
          active: objAnterior.active,
        };

        nuevoEvent.idUserAction = this.idUser;
        nuevoEvent.fullNameUserAction = this.nombreUsuario;
        this.trazabilidad(nuevoEvent, null, 3, 'Eliminación');

        //---------- Fin Trazabilidad----------///
        this.modalService.openStatusMessage('Aceptar', `Diccionario eliminado correctamente en el sistema`, "1");
        await this.getDictionaryList(this.currentPage);
      } else {
        if (r.message.includes("No se puede cambiar el estado del diccionario de datos")) {
          this.modalService.openStatusMessage('Aceptar', 'No es posible eliminar el diccionario de datos porque tiene homologaciones activas vinculadas.', "4")
        }  else {
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al eliminar el diccionario, intente de nuevo`, "4")
        }
      }

    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al eliminar el diccionario, intente de nuevo`, "4")
      this.loaderSvc.hide();

    }

  }


  handlePageChange(page: any) {
    this.currentPage = page;
    this.getDictionaryList(page)
  }

  trazabilidad(antes: Dictionary, despues: Dictionary | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 24,
      idMovimiento,
      modulo: "Homologación",
      movimiento,
      subModulo: "Diccionario de datos"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }
}
