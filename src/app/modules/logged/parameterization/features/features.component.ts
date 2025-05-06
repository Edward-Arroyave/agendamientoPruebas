import { NgClass } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Renderer2,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../../shared/inputs/basic-input/basic-input.component';
import { FileInputComponent } from '../../../../shared/inputs/file-input/file-input.component';
import { ToggleComponent } from '../../../../shared/inputs/toggle/toggle.component';
import { TablaComunComponent } from '../../../../shared/tabla/tabla-comun/tabla-comun.component';
import { LoaderService } from '../../../../services/loader/loader.service';
import { ModalService } from '../../../../services/modal/modal.service';
import { SharedService } from '../../../../services/servicios-compartidos/shared.service';
import { UsersService } from '../../../../services/usuarios/users.service';
import {
  Character,
  CharacterStatus,
} from '../../../../shared/interfaces/parametrizacion/caracteristica.model';
import { FeaturesService } from '../../../../services/parametrizacion/features/features.service';
import { EspecialidadesService } from '../../../../services/parametrizacion/especialidades/especialidades.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { lastValueFrom } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';


@Component({
  selector: 'app-features',
  standalone: true,
  imports: [
    NgxPaginationModule,
    MatIcon,
    ReactiveFormsModule,
    BasicInputComponent,
    RouterLink,
    ToggleComponent
  ],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss',
})
export class FeaturesComponent {
  cabeceros: string[] = [
    'Especialidad',
    'Caracteristica',
    'Estado',
    'Editar',
    'Eliminar',
  ];
  caracteristicas: any[] = [];
  listCaracteristicas: any[] = [];
  caracteristicasFiltradas: any[] = [];
  searchTerm: string = '';
  especialidad: any[] = [];
  caracteristica: any[] = [];

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  formSearch: FormGroup = this.fb.group({
    idSpecialties: [''],
    idCharacteristic: [''],
  });

  paginadorNumber = 10;
  p: number = 1;
  pagedData: any[] = [];

  permisosDelModulo: any;

  constructor(
    private tzs: TrazabilidadService,
    private especialidadesService: EspecialidadesService,
    private userSvc: UsersService,
    private loaderSvc: LoaderService,
    private shadedSVC: SharedService,
    private cdr: ChangeDetectorRef,
    private modalService: ModalService,
    private characterService: FeaturesService,
    private fb: FormBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Características');
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

  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.tabs-container').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.content-tab'), 'height', `${he}px`);
    let paginador = he / 30;
    this.paginadorNumber = Math.floor(paginador / 2);
    this.p = 1;
    this.updatePagedData();
  }

  ngOnInit(): void {
    this.getEspecialidad();
    this.getCaracteristica();
  }
  get fc() {
    return this.formSearch.controls;
  }

  trazabilidad(
    antes: Character, despues: Character | null, idMovimiento: number, movimiento: string) {

    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 11,
      idMovimiento,
      modulo: 'Parametrización',
      movimiento,
      subModulo: 'Caracteristicas',
    };
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  async getCaracteristica() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando caracteristicas' });
      let resp = await lastValueFrom(this.characterService.getCharacter({}));

      if (!resp.ok || resp.data == null) {
        this.modalService.openStatusMessage('Aceptar', `Error al recuperar la lista de características. ${resp.message}`, '4');
        return;
      }

      this.listCaracteristicas = resp.data;
      this.caracteristicas = resp.data.map((character: Character) => ({
        item1: character.specialtiesName,
        item2: character.characteristicName,
        item3: character /*Estado*/,
        item4: character /*Editar*/,
        item5: character /*Eliminar*/,
      }));

      this.caracteristicasFiltradas = [...this.caracteristicas];

      if (this.caracteristicasFiltradas.length > 0) {
        this.updatePagedData();
      }

      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  async getEspecialidad() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando Especialidad' });
      let items = await lastValueFrom(
        this.especialidadesService.getSpecialization({})
      );
      if (items.data) {
        this.especialidad = items.data;
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  buscarCharacter(): void {
    this.loaderSvc.show();
    const especialidadBusqueda = this.formSearch.get('idSpecialties')?.value;
    const caracteristicaSeleccionada =
      this.formSearch.get('idCharacteristic')?.value;

    this.caracteristicasFiltradas = this.caracteristicas.filter((character) => {
      const coincideespecialidad = especialidadBusqueda
        ? character.item1 === especialidadBusqueda
        : true;
      const coincideCaracter = caracteristicaSeleccionada
        ? character.item2 === caracteristicaSeleccionada
        : true;
      return coincideCaracter && coincideespecialidad;
    });
    this.p = 1;
    this.updatePagedData();
    this.loaderSvc.hide();
  }

  limpiarFiltros(): void {
    this.loaderSvc.show();
    this.formSearch.reset();
    this.caracteristicasFiltradas = [...this.caracteristicas];
    this.p = 1;
    this.updatePagedData();
    this.loaderSvc.hide();
  }

  editarCaracteristicas(event: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
      this.getCaracteristica();
      return;
    }
    this.router.navigate([
      'inicio/parametrizacion/caracteristicas/edit/',
      event.idCharacteristic,
    ]);
  }

  async eliminar(event: any): Promise<void> {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '4');
      return;
    }
    let nuevoEvent: Character = JSON.parse(JSON.stringify(event));
    const idCharacteristic = event.idCharacteristic;
    this.loaderSvc.show();

    nuevoEvent.fullNameUserAction = this.nombreUsuario;
    nuevoEvent.idUserAction = this.idUser;

    try {
      let r = await lastValueFrom(
        this.characterService.deleteCharacter(idCharacteristic)
      );
      if (r.ok) {
        this.trazabilidad(nuevoEvent, null, 3, 'Eliminación');
        this.modalService.openStatusMessage('Aceptar', 'Caracteristica eliminada correctamente', '1');
        this.getCaracteristica();
      } else {
        this.modalService.openStatusMessage('Aceptar', r.message, '3');
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrió un error al eliminar la caracteristica, intente de nuevo', '4');
    } finally {
      this.loaderSvc.hide();
    }
  }

  async cambiarEstadoCaracteristica(data: any, estado: boolean): Promise<void> {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
      this.getCaracteristica();
      return;
    }
    const id = data.item3;

    const CharacterChange: CharacterStatus = {
      id: id.idCharacteristic,
      status: estado,
      idUserAction: this.idUser
    };


    let antes: Character = JSON.parse(JSON.stringify(data.item3));
    let despues: Character = JSON.parse(JSON.stringify(data.item3));
    despues.active = estado;
    despues.fullNameUserAction = this.nombreUsuario;
    despues.idUserAction = this.idUser;

    this.loaderSvc.show();

    try {
      const response = await lastValueFrom(this.characterService.saveStatusCharacter(CharacterChange));
      this.loaderSvc.hide();
      if (response.ok) {
        this.trazabilidad(antes, despues, 2, 'Edición');
        this.modalService.openStatusMessage('Aceptar', 'Estado cambiado correctamente', '1');
        //Actualizar el estado directamente en el arreglo:
        let status = this.caracteristicas.find(s => s.item3.idCharacteristic == id.idCharacteristic)
        if (status) status.item3.active = estado
      } else {
        this.modalService.openStatusMessage('Aceptar', response.message, '3');
        this.getCaracteristica();
      }
    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Aceptar', 'Ocurrió un error al cambiar el estado, intente de nuevo', '4');
      this.getCaracteristica();
      console.error('Error al cambiar el estado de la categoría:', error);
    }
  }

  updatePagedData() {
    if (this.caracteristicasFiltradas.length > 0) {
      const start = (this.p - 1) * this.paginadorNumber;
      const end = start + this.paginadorNumber;
      this.pagedData = this.caracteristicasFiltradas.slice(start, end);
    } else {
      this.pagedData = [];
    }
  }

  handlePageChange(event: number) {
    this.p = event;
    this.updatePagedData();
  }
}
