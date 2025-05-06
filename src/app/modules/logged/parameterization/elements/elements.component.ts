import { lastValueFrom } from 'rxjs';
import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
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
import { Elementos, ElementosStatus } from '../../../../shared/interfaces/parametrizacion/elementos.model';
import { ElementsService } from '../../../../services/parametrizacion/elements/elements.service';
import { FeaturesService } from '../../../../services/parametrizacion/features/features.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { firstValueFrom } from 'rxjs';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';

@Component({
  selector: 'app-elements',
  standalone: true,
  imports: [
    NgxPaginationModule,
    MatIcon,
    ReactiveFormsModule,
    BasicInputComponent,
    RouterLink,
    ToggleComponent
  ],
  templateUrl: './elements.component.html',
  styleUrl: './elements.component.scss'
})
export class ElementsComponent {

  cabeceros: string[] = ['Característica','Elemento','Estado','Editar','Eliminar'];
  elemenos: any[] = [];
  caracteristica: any[] = [];
  ElementFilter: any[] = [];
  searchTerm: string = '';

  formSearch: FormGroup = this.fb.group({
    idCharacteristic: [''],
    SFilterElement: ['']
  });

  paginadorNumber = 10;
  p: number = 1;
  pagedData: any[] = [];

  permisosDelModulo: any
  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  constructor(private tzs: TrazabilidadService, private elementService: ElementsService, private characterService: FeaturesService,private loaderSvc: LoaderService, private shadedSVC: SharedService,private cdr: ChangeDetectorRef,private modalService:ModalService,private fb: FormBuilder, private elRef: ElementRef, private renderer: Renderer2, private router: Router, private dialog : MatDialog) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Elementos')
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


  trazabilidad(antes:Elementos,despues:Elementos | null,idMovimiento:number,movimiento:string){
    const dataTrazabilidad:dataTrazabilidad= {
        datos_actuales: antes,
        datos_actualizados: despues,
        idModulo: 11,
        idMovimiento,
        modulo: "Parametrización",
        movimiento,
        subModulo: "Elementos"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
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
    this.loadElements();
    this.getCharacteristic();
  }

  async loadElements(): Promise<void> {
    try {
      const resp = await firstValueFrom(this.elementService.getElementos({}));

      if (!resp.ok || resp.data == null) {
        this.modalService.openStatusMessage('Aceptar', `Ocurrió un error al obtener la lista de elementos. ${resp.message}`, '4');
        return;
      }

      this.elemenos = resp.data.map((elementos: Elementos) => ({
        item1: elementos.characteristicName,
        item2: elementos.elementName,
        item3: elementos, /*Estado*/
        item4: elementos, /*Editar*/
        item5: elementos  /*Eliminar*/
      }));

      this.ElementFilter = [...this.elemenos];

      if (this.ElementFilter.length > 0) {
        this.updatePagedData();
      }

    } catch (error) {
      console.error('Error al obtener los elementos:', error);
    }
  }

  async getCharacteristic() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando caracteristicas' })
      let items = await firstValueFrom(this.characterService.getCharacter({}));
      if (items.data) {
        this.caracteristica = items.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }


  searchCharacter(): void {
    this.loaderSvc.show();
    const caracteristicaSeleccionada = this.formSearch.get('idCharacteristic')?.value;
    const textoEspecialidad = this.formSearch.get('SFilterElement')?.value?.toLowerCase() || '';

    this.ElementFilter = this.elemenos.filter(category => {
      const coincideCaracter = caracteristicaSeleccionada ? category.item1 === caracteristicaSeleccionada : true;
      const coincideTexto = textoEspecialidad ? category.item2.toLowerCase().includes(textoEspecialidad) : true;

      return coincideCaracter && coincideTexto;
    });

    this.p = 1;
    this.updatePagedData();
    this.loaderSvc.hide();
  }

  clearFilters(): void {
    this.loaderSvc.show();
    this.formSearch.reset();
    this.ElementFilter = [...this.elemenos];
    this.p = 1;
    this.updatePagedData();
    this.loaderSvc.hide();
  }




  get fc() { return this.formSearch.controls; }

  editCategory(event: any){
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.loadElements()
      return
    }
    this.router.navigate(["inicio/parametrizacion/elementos/edit/", event.idElement])
  }

  async delete(event: any): Promise<void> {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '4')
      return
    }

    const idElement = event.idElement;
    let nuevoEvent :Elementos = JSON.parse(JSON.stringify(event));
    nuevoEvent.idUserAction = this.idUser;
    nuevoEvent.fullNameUserAction = this.nombreUsuario;
    this.loaderSvc.show();

    try {
      let r = await  lastValueFrom(this.elementService.deleteElementos(idElement));
      if(r.ok){
        this.modalService.openStatusMessage('Aceptar', 'Elemento eliminado correctamente', '1');
        this.loadElements();
        this.trazabilidad(nuevoEvent,null,3,'Eliminación');
      }
      else{
        this.modalService.openStatusMessage('Aceptar', r.message , "3")
      }
    } catch (error) {
        this.modalService.openStatusMessage('Aceptar', 'Ocurrió un error al eliminar la caracteristica, intente de nuevo', '4');
    } finally {
        this.loaderSvc.hide();
    }
  }

  async changeStatusElement(data: any, estado: boolean): Promise<void> {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.loadElements()
      return
    }
    const id = data.item3;

    const ElementChange: ElementosStatus = {
      id: id.idElement,
      status: estado,
      idUserAction: this.shadedSVC.obtenerIdUserAction(),
    };
    let antes :Elementos = JSON.parse(JSON.stringify(data.item3));
    let despues :Elementos = JSON.parse(JSON.stringify(data.item3));
    despues.active = estado;
    despues.fullNameUserAction = this.nombreUsuario;
    despues.idUserAction = this.idUser;

    this.loaderSvc.show();

    try {
      const response = await lastValueFrom(this.elementService.saveStatusElementos(ElementChange));
      this.loaderSvc.hide();

      if (response.ok) {
        this.modalService.openStatusMessage('Aceptar', 'Estado cambiado correctamente', '1');
        this.trazabilidad(antes,despues,2,'Edición');
          //Actualizar el estado directamente en el arreglo:
          let status = this.elemenos.find(s => s.item3.idElement == id.idElement)
          if(status) status.item3.active = estado
      } else {
        this.modalService.openStatusMessage('Aceptar',response.message,'3');
        this.loadElements();
      }
    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Aceptar', 'Ocurrió un error al cambiar el estado, intente de nuevo', '4');
      console.error('Error al cambiar el estado de la categoría:', error);
      this.loadElements();
    }
  }

  updatePagedData() {
    if (this.ElementFilter.length > 0) {
      const start = (this.p - 1) * this.paginadorNumber;
      const end = start + this.paginadorNumber;
      this.pagedData = this.ElementFilter.slice(start, end);
    } else {
      this.pagedData = [];
    }
  }



  handlePageChange(event: number) {
    this.p = event;
    this.updatePagedData();
  }
}
