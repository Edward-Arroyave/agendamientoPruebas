import { NgClass, JsonPipe } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ConsultSchedulingTrazabilityModel } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { NgxPaginationModule } from 'ngx-pagination';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-historical-schedule',
  standalone: true,
  imports: [MatTooltipModule, MatIcon, BasicInputComponent, NgxPaginationModule, NgClass, JsonPipe],
  templateUrl: './historical-schedule.component.html',
  styleUrl: './historical-schedule.component.scss'
})
export class HistoricalScheduleComponent {

  formSearch = this.fb.group({
    documentNumber: [''],
    initialDate: [new Date()],
    finalDate: [new Date()],
    attentionCenter: [''],
    nameUserAction: ['']
  })

  permisosDelModulo: any;

  //Arreglos

  listAttentionCenter: any[] = [];
  data: any[] = [];

  pageSize: number = 5;
  pageNumber: number = 0;
  currentPage: number = 1;
  counter: number = 0;
  paginadorNumber: number = 1;
  orderDescending : boolean = false

  constructor(
    private shadedSVC: SharedService,
    private fb: FormBuilder, private router: Router,
    private loaderSvc: LoaderService,
    private modalService: ModalService, private elRef: ElementRef,
    private renderer: Renderer2,
    private historicalSvc: TrazabilidadService,
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo("Historico de citas");
  }


  async ngOnInit() {
    this.ajustarAlto();
    await this.getAttentionCenter();
    this.formSearch.get('initialDate')?.setValue(new Date());
    this.formSearch.get('finalDate')?.setValue(new Date());
    await this.search(this.currentPage);
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

  clearFilters() {
    this.formSearch.reset();
    this.formSearch.get('initialDate')?.setValue(new Date());
    this.formSearch.get('finalDate')?.setValue(new Date());
    this.orderDescending = false;

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
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando historico' })

      let initialDate = this.formSearch.get('initialDate')?.value || '';
      let finalDate = this.formSearch.get('finalDate')?.value || '';

      if (initialDate) {
        const init = new Date(initialDate);
        init.setHours(0, 0, 0, 0);
        init.setHours(init.getHours() - 5); // Restar 5 horas
        initialDate = init.toISOString();
      }

      if (finalDate) {
        const end = new Date(finalDate);
        end.setHours(23, 59, 59, 999);
        end.setHours(end.getHours() - 5); // Restar 5 horas
        finalDate = end.toISOString();
      }
      let documentNumber = this.formSearch.get('documentNumber')?.value ? String(this.formSearch.get('documentNumber')?.value) : null;
      let attentionCenter = this.formSearch.get('attentionCenter')?.value ? Number(this.formSearch.get('attentionCenter')?.value) : null;
      let nameUserAction = this.formSearch.get('nameUserAction')?.value ? String(this.formSearch.get('nameUserAction')?.value) : null;

      let objectPaginator: ConsultSchedulingTrazabilityModel = {
        documentNumber: documentNumber,
        attentionCenter: attentionCenter,
        nameUserAction: nameUserAction,
        action: null,
        internalCode_ElementName: null,
        createdDateFrom: initialDate,
        createdDateTo: finalDate,
        pageNumber: pageNumber,
        pageSize: this.pageSize,
        orderDescending: this.orderDescending
      }
      if (!pageNumber) this.currentPage = pageNumber;
      else this.currentPage = pageNumber;
      let i: any = await lastValueFrom(this.historicalSvc.consultSchedulingTraza(objectPaginator));
      this.loaderSvc.hide()
      if (i.ok && i.data) {
        this.counter = i.data.totalCount;
        this.data = i.data.items.slice(0, this.pageSize);
      } else {
        this.modalService.openStatusMessage('Aceptar', 'No se encontraron datos', '3')
        this.data = []
        this.currentPage = 1;
      }

    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer los datos', '4')
      console.log(error)
      this.loaderSvc.hide()
    }
  }

}
