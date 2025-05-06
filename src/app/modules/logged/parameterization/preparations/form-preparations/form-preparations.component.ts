import { JsonPipe, NgClass, CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { CategoryService } from '@app/services/parametrizacion/categorias/category.service';
import { EspecialidadesService } from '@app/services/parametrizacion/especialidades/especialidades.service';
import { FeaturesService } from '@app/services/parametrizacion/features/features.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { UsersService } from '@app/services/usuarios/users.service';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '@app/shared/inputs/toggle/toggle.component';
import { MatTabsModule } from '@angular/material/tabs';
import { PreparationsService } from '@app/services/parametrizacion/preparations/preparations.service';
import { ElementsService } from '@app/services/parametrizacion/elements/elements.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { lastValueFrom } from 'rxjs';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { IPreparation } from '@app/shared/interfaces/parametrizacion/preparaciones.model';

@Component({
  selector: 'app-form-preparations',
  standalone: true,
  imports: [MatCheckbox, CommonModule, MatTabsModule, MatInputModule, FormsModule, MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatTooltipModule, BasicInputComponent, ToggleComponent],
  templateUrl: './form-preparations.component.html',
  styleUrl: './form-preparations.component.scss'
})
export class FormPreparationsComponent {

  categorias: any[] = [];
  espacialidades: any[] = [];
  caracteristicas: any[] = [];
  currentEspeciality: string | null = null;
  currentCaracteristic: string | null = null;
  currentElements: any | null = null;
  idPreparation: any;
  elementos: any[] = [];
  arregloElementos: any[] = [];
  cuidades: any[] = [];
  sede: any[] = [];
  preparat: any;
  CondicionEspecial: any[] = [];
  essentialRequirement: any;
  selectedTabIndex: number = 0;
  formPre = this.fb.group({
    idCategory: ['', [Validators.required]],
    idSpecialties: ['', [Validators.required]],
    idCharacteristic: ['', [Validators.required]],
    elements: [[],],
    observations: [''],
    preconditions: [''],
    indications: [''],
    listRequeriments: this.fb.array([]),
  });

  eliminados: any[] = [];
  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  preparacionActual: any;

  constructor(private actRoute: ActivatedRoute,
    private features: FeaturesService, private fb: FormBuilder,
    private elRef: ElementRef, private renderer: Renderer2,
    private router: Router, private preparationSVC: PreparationsService,
    private shadedSVC: SharedService, private especialidadesService: EspecialidadesService,
    private loaderSvc: LoaderService,
    private elementService: ElementsService, private userSvc: UsersService,
    private loaderService: LoaderService, private modalService: ModalService,
    private categoriaService: CategoryService, private tzs: TrazabilidadService,) {
    this.idPreparation = this.actRoute.snapshot.params['idPreparation'];
  }

  async ngOnInit() {

    await this.getCategorias();
    this.filtrosInputs()
    this.filtroElementos()
    if (this.idPreparation) {
      await this.loadPreData(this.idPreparation);
    }
  }

  ngAfterViewInit() {
    this.ajustarAlto();
    this.formPre.valueChanges.subscribe(() => {
      this.ajustarAlto();
    });
  }

  campoDeshabilitado(form: FormGroup, campo: string) {
    this.formPre.get(campo)?.disable({ onlySelf: true });
  }

  filtrosInputs() {

    this.fc.idCategory.valueChanges.subscribe(async p => {

      if (p) {
        await this.getEspecialidad(Number(p));
      }

    })
    this.fc.idSpecialties.valueChanges.subscribe(async p => {
      if (p) await this.getCaracteristicas(Number(p));

    })
    this.fc.idCharacteristic.valueChanges.subscribe(async p => {
      if (p) {
        await this.getElementos(Number(p));
      }
    })
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

  filtroElementos() {
    this.fc.elements.valueChanges.subscribe((p: any) => {
      if (!this.idPreparation) return
      this.arregloElementos = []
      this.elementos.forEach(element => {
        element.checked = false
      });
      if (p && p != '' && p.length) {

        for (const e of p) {
          let obj = {
            idElement: e,
            active: true
          }
          let elem = this.elementos.find(s => s.idElement == e)
          if (elem) {
            elem.checked = true;
          }
          this.arregloElementos.push(obj)
        }
      }


    })
  }
  async loadPreData(idPreparation: string): Promise<void> {
    try {
      this.loaderSvc.show();
      let response = await this.preparationSVC.getPreparationForId(idPreparation).toPromise();

      if (response?.data) {
        const preData = response.data;

        const elementsArray = preData.elements ? preData.elements.split(',').map(Number) : [];

        this.fc.idCategory.setValue(preData.idCategory);
        this.fc.idSpecialties.setValue(preData.idSpecialties);
        this.fc.idCharacteristic.setValue(preData.idCharacteristic);
        if (elementsArray.length) this.fc.elements.setValue(elementsArray);
        this.fc.observations.setValue(preData.observations);
        this.fc.preconditions.setValue(preData.preconditions);
        this.fc.indications.setValue(preData.indications);

        this.elementos = this.elementos.map(element => {
          return {
            ...element,
            checked: elementsArray.includes(element.idElement)
          };
        });
        setTimeout(() => {
          this.campoDeshabilitado(this.formPre, 'idCategory');
          this.campoDeshabilitado(this.formPre, 'idSpecialties');
          this.campoDeshabilitado(this.formPre, 'idCharacteristic');
          this.campoDeshabilitado(this.formPre, 'elements');
        }, 500);

        if (preData.listRequeriments && Array.isArray(preData.listRequeriments)) {
          this.loadRequirements(preData.listRequeriments);
        } else {
          console.warn('No se encontraron requisitos en los datos recibidos.');
        }
        this.preparacionActual = preData

      }
      this.loaderSvc.hide();
    } catch (error) {
      console.error('Error al cargar los datos de la preparación:', error);
      this.loaderSvc.hide();
    }
  }


  toggleEssentialRequirement(index: number, event: boolean) {
    const formArray = this.formPre.get('listRequeriments') as FormArray | null;

    if (formArray) {
      const requisito = formArray.at(index);
      if (requisito && requisito.get('essentialRequirement')) {
        requisito.get('essentialRequirement')?.setValue(event);
      } else {
        console.error('El control "essentialRequirement" no está disponible para el requisito en el índice', index);
      }
    } else {
      console.error('El FormArray "listRequeriments" no está disponible.');
    }
  }

  // Obtener FormArray para listRequeriments
  get listRequeriments(): FormArray<FormGroup> {
    return this.formPre.get('listRequeriments') as FormArray<FormGroup>;
  }

  getRequirementFormGroup(index: number): FormGroup {
    return this.listRequeriments.at(index) as FormGroup;
  }

  loadRequirements(requirements: any[]) {
    const formArray = this.listRequeriments;
    formArray.clear();

    requirements.forEach(req => {
      formArray.push(this.fb.group({
        idRequerimentPreparation: [req.idRequerimentPreparation || 0],
        requirements: [req.requirements || ''],
        essentialRequirement: [req.essentialRequirement || false],
        active: [req.active || true],
        markedForDeletion: [false]
      }));
    });
  }

  toggleActive(index: number) {
    const formArray = this.formPre.get('listRequeriments') as FormArray | null;

    if (formArray) {
      const requisito = formArray.at(index);
      if (requisito && requisito.get('active')) {
        const currentValue = requisito.get('active')?.value || false;
        requisito.get('active')?.setValue(!currentValue);

      } else {
        console.error('El control "active" no está disponible para el requisito en el índice', index);
      }
    } else {
      console.error('El FormArray "listRequeriments" no está disponible.');
    }
  }

  agregarRequisito() {
    const formArray = this.formPre.get('listRequeriments') as FormArray;
    formArray.push(this.fb.group({
      idRequerimentPreparation: [0],
      requirements: [''],
      essentialRequirement: [false],
      active: [true],
      markedForDeletion: [false]
    }));
  }

  eliminarRequisitosActivos() {
    const formArray = this.formPre.get('listRequeriments') as FormArray;

    if (!formArray) {
      console.error('El FormArray "listRequeriments" no está disponible.');
      return;
    }

    for (let i = 0; i < formArray.length; i++) {
      const requisito = formArray.at(i) as FormGroup;

      if (requisito.get('markedForDeletion')?.value) {
        requisito.get('active')?.setValue(false);

        if (!requisito.contains('isHidden')) {
          requisito.addControl('isHidden', new FormControl(true));
        } else {
          requisito.get('isHidden')?.setValue(true);
        }
        if (requisito.get('idRequerimentPreparation')?.value) this.eliminados.push(requisito.value);

        //  requisito.get('markedForDeletion')?.setValue(false);
      }
    }

    // Filtra los requisitos que no están marcados para eliminación
    const activeRequirements = this.listRequeriments.controls.filter(
      (control) => !control.get('markedForDeletion')?.value
    );

    // Vacía el FormArray y vuelve a agregar los requisitos activos
    this.listRequeriments.clear();
    activeRequirements.forEach((control) => {
      this.listRequeriments.push(control);
    });

    // Aquí, el FormArray ya está reorganizado, y los índices de los controles son los correctos.

  }


  async getCategorias() {
    try {
      this.loaderSvc.show()
      this.fc.idCategory.reset()
      this.loaderSvc.text.set({ text: 'Cargando categorias' })
      this.categorias = []
      let items = await lastValueFrom(this.shadedSVC.getCategory());
      this.loaderSvc.hide()
      if (items.ok) {
        this.categorias = items.data;

      }

    } catch (error) {
      this.loaderSvc.hide()
    }

  }

  async getCaracteristicas(idSpeciality: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando caracteristicas' })
      if (!this.idPreparation) this.fc.idCharacteristic.reset();
      this.caracteristicas = []
      let items = await this.shadedSVC.getCharacteristic(idSpeciality).toPromise();
      this.loaderSvc.hide()
      if (items.ok) {
        this.caracteristicas = items.data;
        setTimeout(() => {
          if (this.currentCaracteristic) {
            this.fc.idCharacteristic.setValue(this.currentCaracteristic)
            this.currentCaracteristic = null
          }
        }, 100);
      }

    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  async getElementos(idCharacteristic: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando elementos' })
      if (!this.idPreparation) this.fc.elements.reset();
      this.elementos = []
      let items = await lastValueFrom(this.shadedSVC.getElementos(idCharacteristic));
      this.loaderSvc.hide()
      if (items.ok) {
        this.elementos = items.data.map((e: any) => {
          e.checked = false
          return e
        });
        setTimeout(() => {
          if (this.currentElements !== null && this.currentElements.length) {
            let elementosCargados: any = [];

            for (const el of this.currentElements) {
              if (el && el.active) {
                elementosCargados.push(el.idElement);
              }
            }
            this.fc.elements.setValue(elementosCargados)
            this.currentElements = null
          }
        }, 100);
      }

    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  async getEspecialidad(idCategory: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando especialidades' });
      if (!this.idPreparation) this.fc.idSpecialties.reset();
      this.espacialidades = []
      this.validarObligatoriedadElemento(idCategory)
      let items = await lastValueFrom(this.shadedSVC.getSpecialization(idCategory));
      this.loaderSvc.hide()
      if (items.ok) {
        this.espacialidades = items.data;
        setTimeout(() => {
          if (this.currentEspeciality) {
            this.fc.idSpecialties.setValue(this.currentEspeciality)
            this.currentEspeciality = null
          }
        }, 100);
      }


    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  async save(): Promise<void> {
    this.formPre.markAllAsTouched();
    this.formPre.updateValueAndValidity();

    if (this.formPre.invalid && !this.idPreparation) {
      console.warn('Formulario inválido, revisa los campos.');
      return;
    }

    const selectedElements = Array.isArray(this.fc.elements.value)
      ? (this.fc.elements.value as number[]).join(',')
      : null;


    const listRequerimentsArray = this.formPre.get('listRequeriments') as FormArray;

    //validar aquellos que tengan valor realmente
    const activeRequirements = this.listRequeriments.controls.filter(
      (control) => control.get('requirements')?.value
    );

    // Vacía el FormArray y vuelve a agregar los requisitos llenos
    this.listRequeriments.clear();
    activeRequirements.forEach((control) => {
      this.listRequeriments.push(control);
    });

    //Unificar con arreglo de eliminados para que el backend lo saque con la propiedad active
    this.eliminados.forEach(item => listRequerimentsArray.push(this.fb.control(item)));


    const characterData = {
      ...this.formPre.getRawValue(),
      elements: selectedElements,
      idPreparation: this.idPreparation ? + this.idPreparation : 0,
      active: true,
      observations: this.fc.observations.value || '',
    };


    //Elemento para trazabilidad//
    let antes;
    let despues;
    if (this.idPreparation) {
      const nuevoObj = {
        ...characterData,
        fullNameUserAction: this.nombreUsuario,
      };

      antes = this.preparacionActual;
      despues = JSON.parse(JSON.stringify(nuevoObj));
      despues.idUserAction = this.idUser;
      despues.fullNameUserAction = this.nombreUsuario;
      despues.categoryName = this.categorias.find(e => this.preparacionActual.idCategory == e.idCategory).categoryName
      despues.characteristicName = this.caracteristicas.find(e => this.preparacionActual.idCharacteristic == e.idCharacteristic).characteristicName
      despues.specialtiesName = this.espacialidades.find(e => this.preparacionActual.idSpecialties == e.idSpecialties).specialtiesName
      despues.preparationCode = this.preparacionActual ? this.preparacionActual.preparationCode : null
    } else {
      const nuevoObj = {
        ...characterData,
        idUserAction : this.idUser,
        fullNameUserAction: this.nombreUsuario,
        categoryName: this.categorias.find(e => characterData.idCategory == e.idCategory).categoryName,
        characteristicName: this.caracteristicas.find(e => characterData.idCharacteristic == e.idCharacteristic).characteristicName,
        specialtiesName: this.espacialidades.find(e => characterData.idSpecialties == e.idSpecialties).specialtiesName
      };
      antes = JSON.parse(JSON.stringify(nuevoObj));
    }


    this.loaderSvc.show();
    try {
      const response = await this.preparationSVC.saveCreatePre(characterData).toPromise();

      if (response?.ok) {
        this.loaderSvc.hide();
        const successMessage = `¡Preparación ${this.idPreparation ? 'actualizada' : 'agregada'} al sistema correctamente!`;
        this.modalService.openStatusMessage('Aceptar', successMessage, '1');
        this.router.navigate(['/inicio/parametrizacion/preparaciones']);
        this.idPreparation ? this.trazabilidad(antes, despues, 2, 'Edición') : this.trazabilidad(antes, null, 1, 'Creación');
      } else {
        this.loaderSvc.hide();
        const errorMessage = response?.message || 'Ocurrió un error al procesar la solicitud.';
        this.modalService.openStatusMessage('Volver', errorMessage, '4');
      }
    } catch (error: any) {
      console.error('Error al guardar la preparación:', error);
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Volver', 'Ocurrió un error al procesar la solicitud.', '4');
    }
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  get fv() {
    return this.formPre.value
  }
  get fc() {
    return this.formPre.controls
  }

  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.title-form').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.form'), 'height', `${he}px`);
  }
  cancelar() {
    this.router.navigate(['/inicio/parametrizacion/preparaciones'])
  }

  validarObligatoriedadElemento(idCategory: any) {
    let categoria = this.categorias.find(e => e.idCategory == idCategory);
    if (categoria && categoria.requireElements) {
      this.fc.elements.addValidators(Validators.required);
    } else {
      this.fc.elements.clearValidators();
    }
    this.fc.elements.updateValueAndValidity()
  }

}
