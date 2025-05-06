import { CommonModule, NgClass } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '../../../../../shared/inputs/toggle/toggle.component';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { CategoryService } from '../../../../../services/parametrizacion/categorias/category.service';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { UsersService } from '../../../../../services/usuarios/users.service';
import { EspecialidadesService } from '../../../../../services/parametrizacion/especialidades/especialidades.service';
import { escialityStatus, Especialidades, SpecialtyResponse } from '../../../../../shared/interfaces/parametrizacion/especialidades.model';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { ModalData } from '../../../../../shared/globales/Modaldata';
import { ModalGeneralComponent } from '../../../../../shared/modals/modal-general/modal-general.component';
import { MatDialog } from '@angular/material/dialog';
import { IconosService } from '../../../../../services/registro-iconos/iconos.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-form-specialization',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    BasicInputComponent,
    ToggleComponent
  ],
  templateUrl: './form-specialization.component.html',
  styleUrl: './form-specialization.component.scss'
})
export class FormSpecializationComponent {


  idSpecialties: any;
  categorias: any[] = [];
  operadores: any[] = [];
  iconos: any[] = [];
  iconosFiltrados: any[] = [];
  especialidad: any;
  formSearch!: FormGroup;
  nephroprotection: any;
  isEdit: boolean = false;
  nefropro: boolean = false;
  isAssociatedExam: boolean = false;

  operadoresIntermedio: any[] = [];


  // Formulario de especialidades
  formEspecialidades = this.fb.group({
    idCategory: ['', Validators.required],
    specialtiesName: ['', Validators.required],
    idIconSpecialties: ['', Validators.required],
    nephroprotection: [false],
    active: [true],
    idOperatorMin: [0],
    valuesMin: [],
    idOperatorInter: [0],
    valuesInter1: [{ value: null, disabled: true }],
    valuesInter2: [{ value: null, disabled: true }],
    idOperatorMax: [0],
    valuesMax: [{ value: null, disabled: true }],
    maximumTime: [0],
    observations: [''],
    iconName: ['', [Validators.required]]
  });

  @ViewChild('iconSelection') iconSelectionTemplate!: TemplateRef<any>;
  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  constructor(private tzs: TrazabilidadService, private modalSvc: ModalService, private actRoute: ActivatedRoute, private fb: FormBuilder, private elRef: ElementRef, private renderer: Renderer2,
    private router: Router, private dialog: MatDialog, private shadedSVC: SharedService, private loaderSvc: LoaderService, private especialidadesService: EspecialidadesService,
    private iconosService: IconosService, private userSvc: UsersService, private loaderService: LoaderService, private modalService: ModalService, private categoriaService: CategoryService) {
    this.idSpecialties = this.actRoute.snapshot.params['idSpecialties'];
  }

  async ngOnInit(): Promise<void> {
    await this.cargarDatosAuxiliares();
    this.observeCategories()
    if (this.idSpecialties) {
      await this.getEspecialidadById(this.idSpecialties);
    }
    this.formSearch = this.fb.group({
      search: ['']
    });

    const nephroprotectionValue = this.formEspecialidades.get('nephroprotection')?.value ?? false;
    this.toggleNephroprotectionValidators(nephroprotectionValue);

    // this.formEspecialidades.get('idOperatorInter')?.valueChanges.subscribe(value => {
    //   this.toggleIntermediateValidators(value);
    // });

  }


  ngAfterViewInit() {
    this.ajustarAlto();
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

  observarFormulario(value: number) {
    if (value) {
      this.formEspecialidades.get('valuesInter1')?.setValidators([Validators.min(value + 1)])
    } else {
      this.formEspecialidades.get('valuesInter1')?.clearValidators
    }
  }

  observeCategories() {
    this.formEspecialidades.get('idCategory')?.valueChanges.subscribe(c => {
      if (c) {
        let category = this.categorias.find(e => e.idCategory == c);
        if (category && category.associatedExam) {
          this.isAssociatedExam = true;
          this.nefropro = false;
          this.nephroprotection = false;
          this.setNefroproteccion(false);


        } else {
          this.isAssociatedExam = false;
        }
      }
    })
  }

  // Carga los datos necesarios
  private async cargarDatosAuxiliares() {
    await Promise.all([
      this.getCategorias(), this.cargarIconosEspecialidad(), this.getOperatorLogic()
    ]);
  }



  async getEspecialidadById(id: number): Promise<void> {
    try {
      this.loaderSvc.show();
      const response = await lastValueFrom(this.especialidadesService.getSpecialization({ IdSpecialties: id }));

      if (!response.ok || response.data == null) {
        this.modalService.openStatusMessage('Aceptar', `Error al recuperar la lista de especialidades. ${response.message}`, '4')
        this.loaderSvc.hide();
        return;
      }

      const especialidad = response.data[0];
      this.especialidad = especialidad;

      if (especialidad) {
        this.formEspecialidades.patchValue({
          idCategory: especialidad.idCategory,
          specialtiesName: especialidad.specialtiesName,
          idIconSpecialties: especialidad.idIconSpecialties,
          nephroprotection: especialidad.nephroprotection,
          idOperatorMin: especialidad.idOperatorMin,
          valuesMin: especialidad.valuesMin,
          idOperatorInter: especialidad.idOperatorInter,
          valuesInter1: especialidad.valuesInter1,
          valuesInter2: especialidad.valuesInter2,
          idOperatorMax: especialidad.idOperatorMax,
          valuesMax: especialidad.valuesMax,
          maximumTime: especialidad.maximumTime || 0,
          active: especialidad.active,
          observations: especialidad.observations,
          iconName: this.iconos.find(icono => icono.idIconSpecialties === especialidad.idIconSpecialties)?.iconName || ''
        });
        if (especialidad.nephroprotection) {
          this.habilitarCampos(especialidad.valuesMin, 2);
          this.setNefroproteccion(especialidad.nephroprotection);
          if (especialidad.valuesInter1 > 0) {
            this.toggleIntermediateValidators(especialidad.valuesMin);
            this.valorMinimoParaMaximo();
          }
        }
      }

      this.loaderSvc.hide();
    } catch (error) {
      console.error('Error al cargar la especialidad:', error);
      this.loaderSvc.hide();
    }
  }

  setNefroproteccion($event: boolean) {
    this.nefropro = $event;
    this.nephroprotection = $event;
    this.formEspecialidades.get('nephroprotection')?.setValue($event);
    if (!$event) {
      this.limpiarMinimo();
      this.limpiarMaximo();
      this.limpiarIntermedio();
    }
    this.toggleNephroprotectionValidators($event);
  }

  private toggleNephroprotectionValidators(isActive: boolean): void {
    const camposObligatorios = ['idOperatorMin', 'valuesMin', 'maximumTime'];

    camposObligatorios.forEach(campo => {
      const control = this.formEspecialidades.get(campo);
      if (control) {
        if (isActive) {
          if (campo === 'idOperatorMin') control.setValue(1);
          if (campo === 'maximumTime') {
            control.setValidators([Validators.required, Validators.min(1), Validators.max(30)]);
          } else {
            control.setValidators([Validators.required, Validators.min(1)]);
          }
        } else {
          control.clearValidators();
        }
        control.updateValueAndValidity();
      }
    });
  }


  // Método para activar/desactivar validadores condicionales de maximos
  private obligatorioMaximo(value: number): void {
    const camposMaximo = ['valuesMax', 'idOperatorMax'];
    camposMaximo.forEach(campo => {
      const control = this.formEspecialidades.get(campo);
      if (campo === 'idOperatorInter') { control?.setValue(3); return }
      if (control) {
        if (value) {
          control.setValidators([Validators.required]);
        } else {
          control.clearValidators();
        }
        control.updateValueAndValidity();
      }
    });
  }

  // Método para activar/desactivar validadores condicionales de maximo
  toggleIntermediateValidators(value: any): void {
    if (value === 0) return;
    const camposIntermedios = ['idOperatorInter', 'valuesInter1', 'valuesInter2', 'observations'];
    camposIntermedios.forEach(campo => {
      const control = this.formEspecialidades.get(campo);
      if (control) {
        if (value) {
          if (campo === 'idOperatorInter') control.setValue(4);
          if (campo === 'valuesInter1') control.setValidators([Validators.required, Validators.min(Number(this.formEspecialidades.get('valuesMin')?.value))]);
          if (campo === 'valuesInter2') control.setValidators([Validators.required, Validators.min(Number(this.formEspecialidades.get('valuesInter1')?.value) + 1)]);
          if (campo === 'observations') control.setValidators([Validators.required]);
        } else {
          control.clearValidators();
        }
        control.updateValueAndValidity();
      }
    });
    this.obligatorioMaximo(value);
  }

  habilitarCampos(target: any, tipo: number = 1) {
    let targetValue = target;
    if (tipo === 1) targetValue = target.target.value;
    if (!targetValue) return;
    const camposIntermedios = ['valuesInter1', 'valuesInter2', 'observations', 'valuesMax'];
    camposIntermedios.forEach(campo => {
      const control = this.formEspecialidades.get(campo);
      if (control) {
        control.enable({ onlySelf: true });
      }
      control?.updateValueAndValidity();
    })
  }

  valorMinimoParaMaximo() {
    const controlValue1 = this.formEspecialidades.get('valuesInter1');
    const controlValue2 = this.formEspecialidades.get('valuesInter2');
    const control = this.formEspecialidades.get('valuesMax');
    if (control) {
      if (controlValue2 && controlValue2?.value! > control?.value!) {
        control.setValue(null);
      }
      control.setValidators([Validators.required, Validators.min(Number(this.formEspecialidades.get('valuesInter2')?.value))]);
    }
    if (!controlValue1?.value) {
      controlValue1?.setValidators([Validators.required]);
    }

  }


  limpiarMinimo() {
    this.formEspecialidades.patchValue({
      idOperatorMin: 0,
      valuesMin: null,
      maximumTime: 0
    });
  }

  limpiarIntermedio() {
    this.formEspecialidades.patchValue({
      idOperatorInter: 0,
      valuesInter1: null,
      valuesInter2: null,
      observations: '',
      valuesMax: null
    });
    const camposIntermedios = ['valuesInter1', 'valuesInter2', 'observations', 'valuesMax'];
    camposIntermedios.forEach(campo => {
      const control = this.formEspecialidades.get(campo);
      if (control) {
        control.clearValidators();
      }
      control?.updateValueAndValidity();
    })
  }

  limpiarMaximo() {
    this.formEspecialidades.patchValue({
      idOperatorMax: 0,
      valuesMax: null
    });
  }


  // Método que llama al servicio getEspecialidadIcon
  cargarIconosEspecialidad(): void {
    this.especialidadesService.getEspecialidadIcon({}).subscribe(data => {
      if (data && data.ok) {
        this.iconos = data.data;
        this.iconosFiltrados = [...this.iconos];
      } else {
        console.error('No se pudieron cargar los iconos');
      }
    }, error => {
      console.error('Error al cargar los iconos:', error);
    });
  }

  // Filtrar los iconos en base al término de búsqueda
  filtrarIconos(searchTerm: string): void {
    this.iconosFiltrados = this.iconos.filter(icono =>
      icono.iconName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Método para seleccionar el icono
  seleccionarIcono(icono: any): void {
    this.formEspecialidades.patchValue({
      idIconSpecialties: icono.idIconSpecialties,
      iconName: icono.iconName
    });

    this.dialog.closeAll();
  }


  openModalCustomed(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {
    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: this.iconSelectionTemplate,
      btn: 'Cancelar',
      footer: true,
      title: titulo,
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      dialogRef.close();
    });
  }

  async getCategorias() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando categorias' })
      let items = await this.categoriaService.getCategory({}).toPromise();
      if (items.data) {
        this.categorias = items.data.filter((c: any) => c.active === true);
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }
  async getOperatorLogic() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando operadores lógicos' });
      let items = await this.especialidadesService.getOperatorLogic({}).toPromise();
      if (items && items.ok) {
        this.operadores = items.data;
        this.operadoresIntermedio = this.operadores.filter(op => op.operatorType === 'Otro'); // Filtrar solo "Otro"
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
      console.error('Error al cargar operadores lógicos:', error);
    }
  }


  async save(): Promise<void> {
    if (this.formEspecialidades.invalid) {
      this.formEspecialidades.markAllAsTouched();
      Object.keys(this.formEspecialidades.controls).forEach(field => {
        const control = this.formEspecialidades.get(field);
        if (control && control.invalid) {
          console.error(`El campo ${field} es inválido. Errores:`, control.errors);
        }
      });

      return;
    }


    let antes;
    let despues;

    const formData = {
      ...this.formEspecialidades.value,
      idSpecialties: this.idSpecialties ? +this.idSpecialties : 0,
      idUserAction: this.shadedSVC.obtenerIdUserAction(),
      nephroprotection: this.formEspecialidades.get('nephroprotection')?.value,

      idOperatorMin: this.formEspecialidades.get('idOperatorMin')?.value || null,
      valuesMin: this.formEspecialidades.get('valuesMin')?.value || null,
      idOperatorInter: this.formEspecialidades.get('idOperatorInter')?.value || null,
      valuesInter1: this.formEspecialidades.get('valuesInter1')?.value || null,
      valuesInter2: this.formEspecialidades.get('valuesInter2')?.value || null,
      idOperatorMax: this.formEspecialidades.get('idOperatorMax')?.value || null,
      valuesMax: this.formEspecialidades.get('valuesMax')?.value || null,
      maximumTime: this.formEspecialidades.get('maximumTime')?.value || 0,
      observations: this.formEspecialidades.get('observations')?.value || '',

      active: this.formEspecialidades.get('active')?.value,
      idUserUpdate: 0,
    };

    if (this.idSpecialties) {
      const nuevoObj = {
        ...formData,
        fullNameUserAction: this.nombreUsuario,
      };
      antes = this.especialidad;

      despues = JSON.parse(JSON.stringify(nuevoObj));
      despues.active = this.especialidad.active;
      despues.idUserAction = this.idUser;
      despues.fullNameUserAction = this.nombreUsuario;

    } else {
      const nuevoObj = {
        ...formData,
        fullNameUserAction: this.nombreUsuario,
      };
      antes = JSON.parse(JSON.stringify(nuevoObj));
    }

    try {
      this.loaderSvc.show();
      const response = await lastValueFrom(this.especialidadesService.saveEspecialidades(formData));

      // Verificar si la respuesta fue exitosa antes de mostrar el mensaje
      if (response && response.ok) {
        const successMessage = `¡Especialidad ${this.idSpecialties ? 'actualizada' : 'agregada'} en el sistema correctamente!`;
        this.modalSvc.openStatusMessage('Aceptar', successMessage, '1');
        this.router.navigate(['/inicio/parametrizacion/especializaciones']);
        this.idSpecialties ? this.trazabilidad(antes, despues, 2, 'Edición') : this.trazabilidad(antes, null, 1, 'Creación');
      } else {
        // Mostrar un mensaje de error si la respuesta no es exitosa
        const errorMessage = response?.message || 'Ocurrió un error al procesar la solicitud. Por favor, intente de nuevo.';
        this.modalSvc.openStatusMessage('Volver', `Ocurrió un error: ${errorMessage}`, '4');
      }
    } catch (error: any) {
      console.error('Error al guardar la especialidad:', error);

      const errorMessage = error?.error?.message || 'Ocurrió un error al procesar la solicitud. Por favor, intente de nuevo.';
      this.modalSvc.openStatusMessage('Volver', `Ocurrió un error: ${errorMessage}`, '4');
    } finally {
      this.loaderSvc.hide();
    }
  }


  @HostListener('window:resize', ['$event'])
  onResize(): void {
    setTimeout(() => {
      this.ajustarAlto();
    }, 100);
  }

  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.title-form').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.form'), 'height', `${he}px`);
  }

  cancelar() {
    this.router.navigate(['/inicio/parametrizacion/especializaciones'])
  }

  // valores y controles del formulario
  get fv() { return this.formEspecialidades.value; }
  get fc() { return this.formEspecialidades.controls; }
}
