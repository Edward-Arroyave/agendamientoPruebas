import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Renderer2,
  TemplateRef,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { BasicInputComponent } from '../../../../shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '../../../../shared/inputs/toggle/toggle.component';

import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { ModalService } from '@app/services/modal/modal.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { PreparationsService } from '@app/services/parametrizacion/preparations/preparations.service';
import { IPreparation, PreStatus } from '@app/shared/interfaces/parametrizacion/preparaciones.model';
import { ModalData } from '@app/shared/globales/Modaldata';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { firstValueFrom, lastValueFrom, Subject, takeUntil } from 'rxjs';
import { ElementsService } from '@app/services/parametrizacion/elements/elements.service';
import { NgxPaginationModule } from 'ngx-pagination';
import moment from 'moment';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';

@Component({
  selector: 'app-preparations',
  standalone: true,
  imports: [
    NgxPaginationModule,
    CommonModule,
    MatIcon,
    ReactiveFormsModule,
    BasicInputComponent,
    RouterLink,
    ToggleComponent,
  ],
  templateUrl: './preparations.component.html',
  styleUrl: './preparations.component.scss',
})
export class PreparationsComponent {
  cabeceros: string[] = [
    'Código de preparación',
    'Fecha de creación',
    'Niveles',
    'Requisitos',
    'Estado',
    'Editar',
    'Eliminar',
  ];
  preparaciones: any[] = [];
  PreFiltradas: any[] = [];
  formSearch = this.fb.group({
    search: [''],
  });
  permisosDelModulo: any;
  elemento: any[] = [];
  detailNivel: any;
  detailRequisito: any;

  paginadorNumber = 10;
  p: number = 1;
  pagedData: any[] = [];

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();


  constructor(
    private elementService: ElementsService,
    private loaderSvc: LoaderService,
    private preparationSVC: PreparationsService,
    private fb: FormBuilder,
    private modalService: ModalService,
    private elRef: ElementRef,
    private shadedSVC: SharedService,
    private renderer: Renderer2,
    private router: Router,
    private dialog: MatDialog,
    private tzs: TrazabilidadService,
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Preparaciones');
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto();
    }, 100);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.ajustarAlto();
    });
  }

  trazabilidad(antes: IPreparation, despues: IPreparation | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 11,
      idMovimiento,
      modulo: "Parametrización",
      movimiento,
      subModulo: "Preparaciones"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  private ajustarAlto() {
    const container =
      this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header =
      this.elRef.nativeElement.querySelector('.tabs-container').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(
      this.elRef.nativeElement.querySelector('.content-tab'),
      'height',
      `${he}px`
    );
    let paginador = he / 30;

    this.paginadorNumber = Math.floor(paginador / 2);
    this.p = 1;
    this.updatePagedData();
  }

  ngOnInit(): void {
    this.cargarPreparations();
    this.filtrosPre();
  }

  cargarPreparations(): void {
    this.loaderSvc.text.set({ text: 'Cargando preparaciones' });
    this.preparationSVC.getPreparationForCode('-').subscribe(
      {
        next: (response) => {
          // Procesar la respuesta y mapear los datos
          this.preparaciones = response.data.map((Pre: any) => ({
            item1: String(Pre.idPreparation),
            item2: moment(Pre.creationDate).format('LLL'),
            item3: Pre /*Niveles*/,
            item4: Pre /*Requisitos*/,
            item5: Pre /*Estado*/,
            item6: Pre /*Editar*/,
            item7: Pre /*Eliminar*/,
          }));

          this.PreFiltradas = [...this.preparaciones];

          if (this.PreFiltradas.length > 0) {
            this.updatePagedData();
          }
        },
        error: (error) => {

          this.loaderSvc.hide();
          console.error('Error al obtener las preparaciones:', error);
        },
      }
    );
  }

  filtrosPre(): void {
    this.formSearch.get('search')?.valueChanges.subscribe((searchTerm) => {
      searchTerm = (searchTerm ?? '').trim().toLowerCase();
      if (searchTerm) {
        this.PreFiltradas = this.preparaciones.filter((Pre) =>
          Pre.item1.toLowerCase().includes(searchTerm)
        );
      } else {
        this.PreFiltradas = this.preparaciones;
      }

      this.p = 1;
      this.updatePagedData();
    });
  }

  async cargarElementos(idsElements?: string) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando elementos' });

      const items = await lastValueFrom(this.elementService.getElementos({}));

      if (items.data) {
        if (idsElements) {
          const idsArray = idsElements.split(',');
          this.detailNivel.elements = items.data.filter((elemento: any) =>
            idsArray.includes(elemento.idElement.toString())
          );
        } else {
          this.elemento = items.data;
        }
      }

      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
      console.error('Error al cargar los elementos:', error);
    }
  }
  get elementosFormateados(): string {
    if (this.detailNivel && this.detailNivel.elements) {
      return this.detailNivel.elements
        .map((e: any) => e.elementName)
        .join(' / ');
    }
    return '';
  }

  editarPreparations(event: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage(
        'Aceptar',
        'No cuenta con permisos para editar',
        '4'
      );
      this.cargarPreparations();
      return;
    }
    this.router.navigate([
      'inicio/parametrizacion/preparaciones/edit/',
      event.idPreparation,
    ]);
  }

  async abrirModalDetalle(item: any, template: TemplateRef<any>) {
    await this.LoadPreparations(item.item3.idPreparation);

    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: template,
      btn: '',
      btn2: 'Cerrar',
      footer: true,
      type: '',
      image: '',
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, {
      height: 'auto',
      width: '1175px',
      data,
      disableClose: true,
    });

    dialogRef.componentInstance.primaryEvent
      ?.pipe(takeUntil(destroy$))
      .subscribe((x) => {
        dialogRef.close();
      });
  }

  async abrirModalNiveles(item: any, template: TemplateRef<any>) {
    await this.LoadPreparations(item.item3.idPreparation);
    await this.cargarElementos(this.detailNivel.elements);

    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: template,
      btn: '',
      btn2: 'Cerrar',
      footer: true,
      type: '',
      image: '',
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, {
      height: 'auto',
      width: '1175px',
      data,
      disableClose: true,
    });

    dialogRef.componentInstance.primaryEvent
      ?.pipe(takeUntil(destroy$))
      .subscribe((x) => {
        dialogRef.close();
      });
  }

  private async LoadPreparations(idPreparation: any) {
    try {
      this.loaderSvc.show();
      let response = await firstValueFrom(
        this.preparationSVC.getPreparationForId(idPreparation)
      );

      if (response?.ok && response.data) {
        this.detailNivel = {
          categoryName: response.data.categoryName,
          specialtiesName: response.data.specialtiesName,
          characteristicName: response.data.characteristicName,
          elements: response.data.elements,
        };
        this.detailRequisito = {
          preconditions: response.data.preconditions,
          indications: response.data.indications,
          listRequeriments: response.data.listRequeriments,
        };
      }
      this.loaderSvc.hide();
    } catch (error) {
      console.error('Error al cargar los datos de la preparación:', error);
      this.loaderSvc.hide();
    }
  }

  async eliminarPre(event: any) {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage(
        'Aceptar',
        'No cuenta con permisos para eliminar',
        '4'
      );

      return;
    }
    let idPreparation = event.idPreparation;

    let nuevoEvent: IPreparation = JSON.parse(JSON.stringify(event));
    nuevoEvent.idUserAction = this.idUser;
    nuevoEvent.fullNameUserAction = this.nombreUsuario;
    if (idPreparation) {
      try {
        this.loaderSvc.show();
        let r = await lastValueFrom(this.preparationSVC.deletePreparation(idPreparation));
        this.loaderSvc.hide();
        if (r.ok) {
          this.modalService.openStatusMessage('Aceptar', `Preparación eliminada correctamente`, '1');
          this.cargarPreparations();
          this.trazabilidad(nuevoEvent, null, 3, 'Eliminación');
        } else {
          this.modalService.openStatusMessage('Aceptar', r.message, '3');
          this.cargarPreparations();
        }
      } catch (error) {
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al eliminar la preparación, intente de nuevo`, '4');
        this.cargarPreparations();
        this.loaderSvc.hide();
      }
    }
  }

  async cambiarEstadoPre(data: any, estado: boolean): Promise<void> {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
      this.cargarPreparations();
      return;
    }
    const item = data.item6;

    const PreChange: PreStatus = {
      idPreparation: item.idPreparation,
      active: estado,
      elements: item.existElement,
      // idUserAction: this.shadedSVC.obtenerIdUserAction(),
    };

    let antes :IPreparation = JSON.parse(JSON.stringify(data.item3));
    let despues :IPreparation = JSON.parse(JSON.stringify(data.item3));
    despues.active = estado;
    despues.fullNameUserAction = this.nombreUsuario;
    despues.idUserAction = this.idUser;

    this.loaderSvc.show();

    try {
      const response = await this.preparationSVC
        .saveStatusPre(PreChange)
        .toPromise();
      this.loaderSvc.hide();

      if (response.ok) {

        if (response.message.includes('No se puede guardar la preparación debido a que')) {
          this.modalService.openStatusMessage('Aceptar', response.message, '4');
          this.cargarPreparations();

        } else {
          this.modalService.openStatusMessage('Aceptar', `Preparación ${estado ? 'activada' : 'desactivada'} en el sistema correctamente`, '1');
          this.cargarPreparations();
          this.trazabilidad(antes,despues,2,'Edición');
        }

      } else {
        this.modalService.openStatusMessage(
          'Aceptar',
          `No es posible ${estado ? 'activar' : 'desactivar'} preparación, ` + response.message,
          '4'
        );
        this.cargarPreparations();
      }
    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage(
        'Aceptar',
        'Ocurrió un error al cambiar el estado, intente de nuevo',
        '4'
      );
      console.error('Error al cambiar el estado de la categoría:', error);
    }
  }

  updatePagedData() {
    if (this.PreFiltradas.length > 0) {
      const start = (this.p - 1) * this.paginadorNumber;
      const end = start + this.paginadorNumber;
      this.pagedData = this.PreFiltradas.slice(start, end);
    } else {
      this.pagedData = [];
    }
  }

  handlePageChange(event: number) {
    this.p = event;
    this.updatePagedData();
  }
}
