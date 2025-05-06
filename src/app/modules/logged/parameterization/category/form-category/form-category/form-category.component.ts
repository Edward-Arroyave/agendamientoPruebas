import { JsonPipe, NgClass } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../../../../shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '../../../../../../shared/inputs/toggle/toggle.component';
import { LoaderService } from '../../../../../../services/loader/loader.service';
import { SharedService } from '../../../../../../services/servicios-compartidos/shared.service';
import { UsersService } from '../../../../../../services/usuarios/users.service';
import { CategoryService } from '../../../../../../services/parametrizacion/categorias/category.service';
import { Categoria } from '../../../../../../shared/interfaces/parametrizacion/categoria.model';
import { ModalService } from '../../../../../../services/modal/modal.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-form-category',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    BasicInputComponent,
    ToggleComponent,
    NgClass,
    ToggleComponent
  ],
  templateUrl: './form-category.component.html',
  styleUrl: './form-category.component.scss'
})
export class FormCategoryComponent {
  category: any;
  idCategory: string | null = null;
  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();
  // Formulario de categoría
  formCategory = this.fb.group({
    categoryName: ['', Validators.required],
    description: ['', Validators.required],
    requireElements: [false],
    associatedExam: [false],
  });

  constructor(private tzs: TrazabilidadService, private actRoute: ActivatedRoute, private fb: FormBuilder, private elRef: ElementRef, private renderer: Renderer2,
    private router: Router, private shadedSVC: SharedService, private loaderSvc: LoaderService,
    private loaderService: LoaderService, private modalService: ModalService, private categoriaService: CategoryService) {
    this.idCategory = this.actRoute.snapshot.params['idCategory'];
  }

  async ngOnInit() {
    if (this.idCategory) {
      await this.loadCategoryData(this.idCategory);
    }
  }

  trazabilidad(antes: Categoria, despues: Categoria | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 11,
      idMovimiento,
      modulo: "Parametrización",
      movimiento,
      subModulo: "Categorías"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  // Cargar datos de categoría
  private async loadCategoryData(idCategory: string): Promise<void> {
    try {
      this.loaderService.show();
      this.loaderService.text.set({ text: 'Cargando categorías' });

      const response = await lastValueFrom(this.categoriaService.getCategory({ id: idCategory }));
      const categoryData = response?.data?.find((categoria: any) => categoria.idCategory === +idCategory);

      if (categoryData) {
        this.category = categoryData;
        this.fc.requireElements.setValue(categoryData.requireElements);
        this.fc.categoryName.setValue(categoryData.categoryName);
        this.fc.description.setValue(categoryData.description);
        this.fc.associatedExam.setValue(categoryData.associatedExam);
      } else {
        console.error('Categoría no encontrada.');
      }
    } catch (error) {
      console.error('Error al cargar los datos de la categoría:', error);
    } finally {
      this.loaderService.hide();
    }
  }

  // Guardar categoría
  async save(): Promise<void> {
    if (this.formCategory.invalid) {
      return;
    }

    const categoryData = {
      ...this.formCategory.value,
      idCategory: this.idCategory ? +this.idCategory : 0,
      active: true,
      idUserAction: this.shadedSVC.obtenerIdUserAction()
    };

    let antes;
    let despues;
    if (this.idCategory) {
      const nuevoObj = {
        ...categoryData,
      };
      antes = this.category;
      despues = JSON.parse(JSON.stringify(nuevoObj));
      despues.active = this.category.active;
      despues.idUserAction = this.idUser;
      despues.fullNameUserAction = this.nombreUsuario;
      categoryData.active = this.category.active;
    } else {
      const nuevoObj = {
        ...categoryData,
        fullNameUserAction: this.nombreUsuario,
        idUserAction: this.idUser
      };
      antes = JSON.parse(JSON.stringify(nuevoObj));
    }

    try {
      this.loaderSvc.show();
      const response = await lastValueFrom(this.categoriaService.saveCreateUpdate(categoryData));
      this.loaderSvc.hide();

      if (response?.ok) {
        const successMessage = `¡Categoría ${this.idCategory ? 'actualizada' : 'agregada'} al sistema correctamente!`;
        this.idCategory ? this.trazabilidad(antes, despues, 2, 'Edición') : this.trazabilidad(antes, null, 1, 'Creación');

        this.modalService.openStatusMessage('Aceptar', successMessage, '1');
        this.router.navigate(['/inicio/parametrizacion/categorias']);
      } else {
        this.modalService.openStatusMessage('Volver', response.message, '4');
      }

    } catch (error: any) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Volver', 'Ocurrió un error al procesar la solicitud.', '4');
    }
  }



  // Ajustar el alto del formulario dinámicamente
  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.title-form').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.form'), 'height', `${he}px`);
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }
  cancelar() {
    this.router.navigate(['/inicio/parametrizacion/categorias'])
  }

  // Acceso valores y controles del formulario
  get fv() { return this.formCategory.value; }
  get fc() { return this.formCategory.controls; }



}
