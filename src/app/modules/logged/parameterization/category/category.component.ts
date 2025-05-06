import { ChangeDetectorRef, Component, ElementRef, HostListener, Renderer2, signal, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { BasicInputComponent } from '../../../../shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '../../../../shared/inputs/toggle/toggle.component';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Categoria, categoryStarus } from '../../../../shared/interfaces/parametrizacion/categoria.model';
import { CategoryService } from '../../../../services/parametrizacion/categorias/category.service';
import { LoaderService } from '../../../../services/loader/loader.service';
import { ModalService } from '../../../../services/modal/modal.service';
import { SharedService } from '../../../../services/servicios-compartidos/shared.service';
import { UsersService } from '../../../../services/usuarios/users.service';
import { takeUntil } from 'rxjs/operators';
import { lastValueFrom, Subject } from 'rxjs';
import { ModalData } from '../../../../shared/globales/Modaldata';
import { ModalGeneralComponent } from '../../../../shared/modals/modal-general/modal-general.component';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [NgxPaginationModule,MatIcon,ReactiveFormsModule,BasicInputComponent,RouterLink,ToggleComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss'
})
export class CategoryComponent {

  cabeceros: string[] = ['ID','Categoría','Descripcion','Estado','Editar','Eliminar'];
  categorias: any[] = [];
  categoriasFiltradas: any[] = [];
  searchTerm: string = '';
  descripcion = signal<string>('');
  formSearch: FormGroup = this.fb.group({
    search: [''],
  });

  paginadorNumber = 10;
  p: number = 1;
  pagedData: any[] = [];

  permisosDelModulo: any;
  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  constructor(private tzs: TrazabilidadService,private userSvc: UsersService,private loaderSvc: LoaderService, private shadedSVC: SharedService,private cdr: ChangeDetectorRef,private modalService:ModalService, private categoriaService: CategoryService,private fb: FormBuilder, private elRef: ElementRef, private renderer: Renderer2, private router: Router, private dialog : MatDialog) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Categorías');

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
    this.cargarCategorias();
    this.filtrarCategorias();
  }

  trazabilidad(antes:Categoria,despues:Categoria | null,idMovimiento:number,movimiento:string){
    const dataTrazabilidad:dataTrazabilidad= {
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

  cargarCategorias(): void {
    this.loaderSvc.text.set({ text: 'Cargando categorías' });

    this.categoriaService.getCategory({}).subscribe(
      (response: any) => {
        this.loaderSvc.hide();

        this.categorias = response.data.map((categoria: Categoria) => ({
          item1: categoria.idCategory,
          item2: categoria.categoryName,
          item3: categoria, /* Descripción */
          item4: categoria, /* Estado */
          item5: categoria, /* Editar */
          item6: categoria  /* Eliminar */
        }));

        this.categoriasFiltradas = [...this.categorias];

        if (this.categoriasFiltradas.length > 0) {
          this.updatePagedData();
        }
      },
      (error) => {
        this.loaderSvc.hide();
        console.error('Error al obtener las categorías:', error);
      }
    );
  }


  filtrarCategorias(): void {
    this.formSearch.get('search')?.valueChanges.subscribe(searchTerm => {
      searchTerm = (searchTerm ?? '').trim().toLowerCase();

      if (searchTerm) {
        this.categoriasFiltradas = this.categorias.filter(categoria =>
          String(categoria.item1).toLowerCase().includes(searchTerm) ||
          categoria.item2.toLowerCase().includes(searchTerm)
        );
      } else {
        this.categoriasFiltradas = this.categorias;
      }

      this.p = 1;
      this.updatePagedData();
    });
  }


  editarCategoria(event: any){
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.cargarCategorias()
      return
    }
    this.router.navigate(["inicio/parametrizacion/categorias/edit/", event.idCategory])
  }

  abrirModalDetalle(template: TemplateRef<any>, categoria: any) {

    this.descripcion.set(categoria.item3.description);

    const destroy$: Subject<boolean> = new Subject<boolean>();
    /* Variables  recibidas por el modal */
    const data: ModalData = {
      content: template,
      btn: '',
      btn2: 'Cerrar',
      footer: true,
      type: '',
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      dialogRef.close();
    });
  }

  async eliminarC(event: any) {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '4')

      return
    }
    let nuevoEvent :Categoria = JSON.parse(JSON.stringify(event));
    nuevoEvent.idUserAction = this.idUser;
    nuevoEvent.fullNameUserAction = this.nombreUsuario;
    let idCategory = event.idCategory;
    if (idCategory) {
      try {
        this.loaderSvc.show();
        let r = await lastValueFrom(this.categoriaService.deleteCategory(idCategory));
        this.loaderSvc.hide();
        if (r.ok) {
          this.trazabilidad(nuevoEvent,null,3,'Eliminación');
          this.modalService.openStatusMessage('Aceptar', `Categoria eliminada correctamente`, "1")
          this.cargarCategorias();
        }else{
          this.modalService.openStatusMessage('Aceptar', r.message , "3")
        }
      } catch (error) {
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al eliminar la categoria, intente de nuevo`, "4")
        this.loaderSvc.hide();
      }
    }
  }

  async cambiarEstadoC(data: any, estado: boolean): Promise<void> {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.cargarCategorias()
      return
    }
    const idCategory = data.item1;

    const CategoryChange: categoryStarus = {
      id: idCategory,
      status: estado,
      idUserAction: this.shadedSVC.obtenerIdUserAction(),
    };
    let antes :Categoria = JSON.parse(JSON.stringify(data.item3));
    let despues :Categoria = JSON.parse(JSON.stringify(data.item3));
    despues.active = estado;
    despues.fullNameUserAction = this.nombreUsuario;
    despues.idUserAction = this.idUser;
    this.loaderSvc.show();

    try {
      const response = await lastValueFrom(this.categoriaService.saveStatusCategory(CategoryChange));
      this.loaderSvc.hide();

      if (response.ok) {
        this.trazabilidad(antes,despues,2,'Edición');
        this.modalService.openStatusMessage('Aceptar', 'Estado cambiado correctamente', '1');
        //Actualizar el estado directamente en el arreglo:
        let status = this.categorias.find(s => s.item3.idCategory == data.item3.idCategory)
        if(status) status.item3.active = estado
      }  else {
        this.modalService.openStatusMessage('Aceptar',response.message,'3');
        this.cargarCategorias();
      }
    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Aceptar', 'Ocurrió un error al cambiar el estado, intente de nuevo', '4');
      console.error('Error al cambiar el estado de la categoría:', error);
      this.cargarCategorias();
    }
  }

  updatePagedData() {
    if (this.categoriasFiltradas.length > 0) {
      const start = (this.p - 1) * this.paginadorNumber;
      const end = start + this.paginadorNumber;
      this.pagedData = this.categoriasFiltradas.slice(start, end);
    } else {
      this.pagedData = [];
    }
  }



  handlePageChange(event: number) {
    this.p = event;
    this.updatePagedData();
  }




}
