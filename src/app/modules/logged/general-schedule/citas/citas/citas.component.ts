import { NgClass } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';

import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { duration } from 'moment';
import { NgxPaginationModule } from 'ngx-pagination';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [MatTooltipModule, MatIcon, BasicInputComponent, NgxPaginationModule, NgClass],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.scss'
})
export class CitasComponent {
  formSearch = this.fb.group({
    date: [new Date(), Validators.required],
    attentionCenter: ['', Validators.required],
    idCategory: ['', Validators.required],
    idCharacteristic: ['', Validators.required],
    idSpecialties: ['', Validators.required],
  })

  permisosDelModulo: any;

  //Arreglos

  listAttentionCenter: any[] = [];
  categorias: any[] = [];
  espacialidades: any[] = [];
  caracteristicas: any[] = [];
  data: any[] = [{
    appointmentDate: '2023-10-10T00:00:00Z',
    documentNumber: '123456789',
    attentionCenter: 'Centro de Salud 1',
    nameUserAction: 'Usuario 1',
    status: 'Pendiente',
    internalCode_ElementName: 'Elemento 1',
    specialCondition: 'Condición especial 1',
    duration: '30 minutos',
  }];

  pageSize: number = 5;
  pageNumber: number = 0;
  currentPage: number = 1;
  counter: number = 0;
  paginadorNumber: number = 1;

  listcheck: any[] = [];
  checkall: boolean = false;

  constructor(
    private shadedSVC: SharedService,
    private fb: FormBuilder, private router: Router,
    private loaderSvc: LoaderService,
    private modalService: ModalService, private elRef: ElementRef,
    private renderer: Renderer2,

  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo("Historico de citas");
  }




  async ngOnInit() {
    this.ajustarAlto();
    this.filtersSuscription();
    await this.getAttentionCenter();
    await this.getCategory();
    await this.search(this.currentPage);
  }

  filtersSuscription() {
    this.fc.idCategory.valueChanges.subscribe(async (p) => {
      if (p) {
        await this.getEspecialidad(Number(p));
      }
    });
    this.fc.idSpecialties.valueChanges.subscribe(async (p) => {
      if (p) {
        await this.getCaracteristicas(Number(p));
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    this.currentPage = 1;
    setTimeout(() => {
      this.ajustarAlto()
      setTimeout(async () => {
        await this.search(this.currentPage);
      }, 100);
    }, 100)
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

  get fv() {
    return this.formSearch.value;
  }
  get fc() {
    return this.formSearch.controls;
  }

  async getAttentionCenter() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando sedes' })
      let items = await this.shadedSVC.getSedes().toPromise();
      this.loaderSvc.hide()
      if (items.ok && items.data) {
        this.listAttentionCenter = items.data;
      }
    } catch (error) {
      this.loaderSvc.hide()
    }

  }

  async getCategory() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando categorias' });
      this.fc.idSpecialties.reset();
      this.fc.idCharacteristic.reset();
      this.categorias = [];
      this.espacialidades = [];
      this.caracteristicas = [];
      let items = await this.shadedSVC.getCategory().toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.categorias = items.data;
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getEspecialidad(idCategory: number) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando especialidades' });
      this.fc.idSpecialties.reset();
      this.fc.idCharacteristic.reset();
      this.espacialidades = [];
      this.caracteristicas = [];

      let items = await this.shadedSVC.getSpecialization(idCategory).toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.espacialidades = items.data;
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getCaracteristicas(idSpeciality: number) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando caracteristicas' });
      this.fc.idCharacteristic.reset();
      this.caracteristicas = [];
      let items = await this.shadedSVC
        .getCharacteristic(idSpeciality)
        .toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.caracteristicas = items.data;
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  clearFilters() {
    this.formSearch.reset();
  }



  formatDate(dateStr: string): string {
    const date = new Date(dateStr);

    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0'); // enero es 0
    const anio = date.getFullYear();

    let horas = date.getHours();
    const minutos = date.getMinutes().toString().padStart(2, '0');
    const meridiano = horas >= 12 ? 'PM' : 'AM';

    horas = horas % 12 || 12; // convierte 0 a 12 para formato 12h
    const horaStr = horas.toString().padStart(2, '0');

    return `${dia}/${mes}/${anio} ${horaStr}:${minutos} ${meridiano}`;
  }


  handlePageChange(page: any) {
    this.currentPage = page;
    this.search(page)
  }

  async search(pageNumber: number = 1) {
    //  try {
    //   this.loaderSvc.show()
    //   this.loaderSvc.text.set({ text: 'Cargando historico' })

    //   let initialDate = this.formSearch.get('initialDate')?.value || '';
    //   let finalDate = this.formSearch.get('finalDate')?.value || '';

    //   if (initialDate) {
    //     const init = new Date(initialDate);
    //     init.setHours(0, 0, 0, 0);
    //     init.setHours(init.getHours() - 5); // Restar 5 horas
    //     initialDate = init.toISOString();
    //   }

    //   if (finalDate) {
    //     const end = new Date(finalDate);
    //     end.setHours(23, 59, 59, 999);
    //     end.setHours(end.getHours() - 5); // Restar 5 horas
    //     finalDate = end.toISOString();
    //   }
    //   let documentNumber = this.formSearch.get('documentNumber')?.value ? String(this.formSearch.get('documentNumber')?.value) : null;
    //   let attentionCenter = this.formSearch.get('attentionCenter')?.value ? Number(this.formSearch.get('attentionCenter')?.value) : null;
    //   let nameUserAction = this.formSearch.get('nameUserAction')?.value ? String(this.formSearch.get('nameUserAction')?.value) : null;

    //   let objectPaginator: ConsultSchedulingTrazabilityModel = {
    //     documentNumber: documentNumber,
    //     attentionCenter: attentionCenter,
    //     nameUserAction: nameUserAction,
    //     action: null,
    //     internalCode_ElementName: null,
    //     createdDateFrom: initialDate,
    //     createdDateTo: finalDate,
    //     pageNumber: pageNumber,
    //     pageSize: this.pageSize,
    //     orderDescending: this.orderDescending
    //   }
    //   if (!pageNumber) this.currentPage = pageNumber;
    //   else this.currentPage = pageNumber;
    //   let i: any = await lastValueFrom(this.historicalSvc.consultSchedulingTraza(objectPaginator));
    //   this.loaderSvc.hide()
    //   if (i.ok && i.data) {
    //     this.counter = i.data.totalCount;
    //     this.data = i.data.items.slice(0, this.pageSize);
    //   } else {
    //     this.modalService.openStatusMessage('Aceptar', 'No se encontraron datos', '3')
    //     this.data = []
    //     this.currentPage = 1;
    //   }

    // } catch (error) {
    //   this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer los datos', '4')
    //   console.log(error)
    //   this.loaderSvc.hide()
    // }
    // }

  }

  downloadExcel() {

    const dataExcel = this.data.map(item => ({
      'CUPS': item.cups,
      'Nombre del examen': item.examName,
      'Activo': item.active ? 'Sí' : 'No',
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataExcel);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Examenes': worksheet },
      SheetNames: ['Examenes'],
    };

    // Generar un archivo blob directamente
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `examenes_${new Date().getTime()}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

}
