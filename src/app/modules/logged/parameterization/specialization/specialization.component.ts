import { lastValueFrom } from 'rxjs';
import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../../shared/inputs/basic-input/basic-input.component';
import { FileInputComponent } from '../../../../shared/inputs/file-input/file-input.component';
import { ToggleComponent } from '../../../../shared/inputs/toggle/toggle.component';
import { TablaComunComponent } from '../../../../shared/tabla/tabla-comun/tabla-comun.component';

import { ModalService } from '../../../../services/modal/modal.service';
import { LoaderService } from '../../../../services/loader/loader.service';
import { CategoryService } from '../../../../services/parametrizacion/categorias/category.service';
import { SharedService } from '../../../../services/servicios-compartidos/shared.service';
import { UsersService } from '../../../../services/usuarios/users.service';
import { escialityStatus, Especialidades } from '../../../../shared/interfaces/parametrizacion/especialidades.model';
import { EspecialidadesService } from '../../../../services/parametrizacion/especialidades/especialidades.service';
import { NgxPaginationModule } from 'ngx-pagination';

import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';

@Component({
  selector: 'app-specialization',
  standalone: true,
  imports: [
    NgxPaginationModule,
    MatIcon,
    ReactiveFormsModule,
    BasicInputComponent,
    RouterLink,
    ToggleComponent
  ],
  templateUrl: './specialization.component.html',
  styleUrl: './specialization.component.scss'
})
export class SpecializationComponent implements OnInit {
  cabeceros: string[] = ['Categoría', 'Especialidad', 'Estado', 'Editar', 'Eliminar'];
  Specialty: any[] = [];
  SpecialtyFilter: any[] = [];
  searchTerm: string = '';
  categorias: any[] = [];
  especialidad: any[] = [];

  formSearch: FormGroup = this.fb.group({
    idCategory: [''],
    idSpecialties: ['']
  });

  paginadorNumber = 10;
  p: number = 1;
  pagedData: any[] = [];

  permisosDelModulo: any

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();


  constructor(private especialidadesService: EspecialidadesService,
    private categoriaService: CategoryService,
    private userSvc: UsersService, private loaderSvc: LoaderService,
    private shadedSVC: SharedService, private cdr: ChangeDetectorRef,
    private modalService: ModalService, private fb: FormBuilder,
    private elRef: ElementRef, private renderer: Renderer2,
    private router: Router, private dialog: MatDialog,
    private tzs: TrazabilidadService) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Especialidades')
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

  async ngOnInit(): Promise<void> {
    await this.getCategorias();
    await this.getEspecialidad();
    this.cargarEspecialidad();
  }



  cargarEspecialidad(): void {
    this.especialidadesService.getSpecialization({}).subscribe({
      next: (response) => {
        this.Specialty = response.data.map((especialitys: Especialidades) => ({

          item1: especialitys.categoryName,
          item2: especialitys.specialtiesName,
          item3: especialitys, /*Estado*/
          item4: especialitys, /*Editar*/
          item5: especialitys  /*Eliminar*/
        }));
        this.SpecialtyFilter = [...this.Specialty];

        if (this.SpecialtyFilter.length > 0) {
          this.updatePagedData();
        }
      },
      error: (error) => {
        console.error('Error al obtener las categorías:', error);
      }
    });
  }


  async getCategorias() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando categorias' })
      let items = await lastValueFrom(this.categoriaService.getCategory({}));
      if (items.data) {
        this.categorias = items.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  async getEspecialidad() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando Especialidades' })
      let items = await lastValueFrom(this.especialidadesService.getSpecialization({}));
      if (items.data) {
        this.especialidad = items.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  buscarEspecialidades(): void {
    this.loaderSvc.show();

    const categoriaSeleccionada = this.formSearch.get('idCategory')?.value;
    const especialidadBusqueda = this.formSearch.get('idSpecialties')?.value;

    this.SpecialtyFilter = this.Specialty.filter(especiality => {
      // Comparar por identificador de categoría y especialidad
      const coincideCategoria = categoriaSeleccionada ? especiality.item3.idCategory === categoriaSeleccionada : true;
      const coincideEspecialidad = especialidadBusqueda ? especiality.item3.idSpecialties === especialidadBusqueda : true;

      return coincideCategoria && coincideEspecialidad;
    });

    this.updatePagedData();
    this.loaderSvc.hide();
  }



  limpiarFiltros(): void {
    this.loaderSvc.show();
    this.formSearch.reset();
    this.SpecialtyFilter = [...this.Specialty];
    this.p = 1;
    this.updatePagedData();
    this.loaderSvc.hide();
  }


  editarEspecialidad(event: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.cargarEspecialidad()
      return
    }
    this.router.navigate(["inicio/parametrizacion/especializaciones/edit/", event.idSpecialties])
  }

  async eliminar(event: any): Promise<void> {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '4')

      return
    }

    let nuevoEvent :any = JSON.parse(JSON.stringify(event));
    nuevoEvent.idUserAction = this.idUser;
    nuevoEvent.fullNameUserAction = this.nombreUsuario;
    const idSpecialties = event.idSpecialties;
    this.loaderSvc.show();

    try {
      let r = await lastValueFrom(this.especialidadesService.deleteSpecialization(idSpecialties));
      if (r.ok) {
        this.trazabilidad(nuevoEvent,null,3,'Eliminación');
        this.modalService.openStatusMessage('Aceptar', 'Especialidad eliminada correctamente', '1');
        this.cargarEspecialidad();
      } else {
        this.modalService.openStatusMessage('Aceptar', r.message, '3');
      }

    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrió un error al eliminar la especialidad, intente de nuevo', '4');
    } finally {
      this.loaderSvc.hide();
    }
  }

  async cambiarEstadoE(data: any, estado: boolean): Promise<void> {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.cargarEspecialidad()
      return
    }
    const id = data.item3;

    const EspecialityChange: escialityStatus = {
      id: id.idSpecialties,
      status: estado,
      idUserAction: this.shadedSVC.obtenerIdUserAction(),
    };

    let antes :Especialidades = JSON.parse(JSON.stringify(data.item3));
    let despues :Especialidades = JSON.parse(JSON.stringify(data.item3));
    despues.active = estado;
    despues.fullNameUserAction = this.nombreUsuario;
    despues.idUserAction = this.idUser;

    this.loaderSvc.show();

    try {
      const response = await lastValueFrom(this.especialidadesService.saveStatusSpecialization(EspecialityChange))
      this.loaderSvc.hide();

      if (response.ok) {
        this.trazabilidad(antes,despues,2,'Edición');
        this.modalService.openStatusMessage('Aceptar', 'Estado cambiado correctamente', '1');
        //Actualizar el estado directamente en el arreglo:
        let status = this.Specialty.find(s => s.item3.idSpecialties == id.idSpecialties)
        if (status) status.item3.active = estado
      } else {
        this.modalService.openStatusMessage('Aceptar', response.message, '3');
        this.cargarEspecialidad();
      }
    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Aceptar', 'Ocurrió un error al cambiar el estado, intente de nuevo', '4');
      this.cargarEspecialidad();
      console.error('Error al cambiar el estado de la categoría:', error);
    }
  }
  get fc() { return this.formSearch.controls; }

  updatePagedData() {
    if (this.SpecialtyFilter.length > 0) {
      const start = (this.p - 1) * this.paginadorNumber;
      const end = start + this.paginadorNumber;
      this.pagedData = this.SpecialtyFilter.slice(start, end);
    } else {
      this.pagedData = [];
    }
  }

  handlePageChange(event: number) {
    this.p = event;
    this.updatePagedData();
  }


  trazabilidad(antes: Especialidades, despues: Especialidades | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 11,
      idMovimiento,
      modulo: "Parametrización",
      movimiento,
      subModulo: "Especialidades"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }
}
