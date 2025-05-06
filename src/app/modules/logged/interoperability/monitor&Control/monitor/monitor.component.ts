import { JsonPipe, NgClass } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2, TemplateRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { MonitorService } from '@app/services/interoperability/monitor/monitor.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '@app/shared/inputs/toggle/toggle.component';
import { MonitorByNamePage } from '@app/shared/interfaces/interoperability/monitor.model';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [MatTooltipModule, MatIcon, BasicInputComponent, NgxPaginationModule, NgClass, JsonPipe],
  templateUrl: './monitor.component.html',
  styleUrl: './monitor.component.scss'
})
export class MonitorComponent {

  permisosDelModulo: any

  formSearch = this.fb.group({
    initialDate: [new Date()],
    finalDate: [new Date()],
    listIdProcess: [''],
    listStatus: [''],
    internalCodeConsecutive: [''],
  })

  data: any[] = [];
  dataFicti: any[] = [];




  pageSize: number = 5;
  pageNumber: number = 0;
  currentPage: number = 1;
  counter: number = 0;
  paginadorNumber: number = 1;

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  listProcess: any[] = []
  listStatus: any[] = [];
  listcheck: any[] = [];
  checkall: boolean = false;

  titleModal: 'Solicitud' | 'Respuesta' = 'Solicitud'
  currentJson = '{sampleNumber”:”012500007-25”, “medicalDevice”:”DM-01”, “reactive”: “RCT-01”}'



  constructor(private shadedSVC: SharedService,
    private fb: FormBuilder, private router: Router,
    private loaderSvc: LoaderService,
    private modalService: ModalService, private elRef: ElementRef,
    private renderer: Renderer2, private dialog: MatDialog,
    private monitorSvc: MonitorService
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Monitor y control')
  }

  async ngOnInit(): Promise<void> {
    this.ajustarAlto()
    this.getLastWeekDate();
    await this.getlistStatus();
    await this.getlistProcess();
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

  async getLastWeekDate() {

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7); // Restar 7 días

    const formatDate = (date: Date): string =>
      date.toISOString().split('T')[0]; // Convierte a "YYYY-MM-DD"

    this.formSearch.get('finalDate')?.setValue(today);
    this.formSearch.get('initialDate')?.setValue(lastWeek);

    await this.search();
  }

  async getlistStatus() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando estados' })
      let i: any = await lastValueFrom(this.monitorSvc.getStatusList());
      this.loaderSvc.hide()
      if (i.ok && i.data) {
        this.listStatus = i.data;
      } else {
      }
    } catch (error) {
      this.loaderSvc.hide()
    }
  }
  async getlistProcess() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando procesos' })
      let i: any = await lastValueFrom(this.monitorSvc.getProcessList());
      this.loaderSvc.hide()
      if (i.ok && i.data) {
        this.listProcess = i.data;
      } else {
      }
    } catch (error) {
      this.loaderSvc.hide()
    }
  }


  async search(pageNumber: number = 1) {
    try {
      this.cleanChecks();
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando integraciones' })


      let initialDate = this.formSearch.get('initialDate')?.value || '';
      let finalDate = this.formSearch.get('finalDate')?.value || '';

      if (initialDate) {
        initialDate = new Date(new Date(initialDate).setHours(0, 0, 0, 0)).toISOString();
      }

      if (finalDate) {
        finalDate = new Date(new Date(finalDate).setHours(23, 59, 59, 999)).toISOString();
      };

      let listIdProcess = this.formSearch.get('listIdProcess')?.value ? String(this.formSearch.get('listStatus')?.value) : '';
      let listStatus = this.formSearch.get('listStatus')?.value ? String(this.formSearch.get('listStatus')?.value) : '';
      let idMonitorAndControl = this.formSearch.get('internalCodeConsecutive')?.value ? Number(this.formSearch.get('internalCodeConsecutive')?.value) : 0;
      let objectPaginator: MonitorByNamePage = {
        initialDate,
        finalDate,
        listIdProcess,
        listStatus,
        internalCodeConsecutive: '',
        idMonitorAndControl,
        pageSize: this.pageSize,
        pageNumber: pageNumber || 1
      }
      if (!pageNumber) this.currentPage = pageNumber;
      else this.currentPage = pageNumber;
      let i: any = await lastValueFrom(this.monitorSvc.getMonitor(objectPaginator));
      this.loaderSvc.hide()
      if (i.ok && i.data) {
        this.counter = i.data.RegistrosTotales;
        this.data = i.data.PeticionesMonitorYControl.slice(0, this.pageSize);
      } else {
        this.modalService.openStatusMessage('Aceptar', 'No se encontraron datos del monitor', '3')
        this.data = []
        this.currentPage = 1;
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer los datos del monitor', '4')

      this.loaderSvc.hide()
    }
  }


  handlePageChange(page: any) {
    this.currentPage = page;
    this.search(page)
  }

  checkAllMonitor(event: boolean) {
    this.checkall = event;
    this.listcheck = []

  }
  checkOneMonitor(event: boolean, id: number) {
    this.checkall = false;

    if (event) {
      // Si el id no está en la lista, agrégalo
      if (!this.listcheck.includes(id)) {
        this.listcheck.push(id);
      }
    } else {
      // Si el id está en la lista y event es false, elimínalo
      this.listcheck = this.listcheck.filter(item => item !== id);
    }
  }


  generarDataFalsa() {
    for (let i = 0; i < 74; i++) {
      this.dataFicti.push({ a: 'sffdsdfds', b: 'sffdsdfds', c: 'sffdsdfds', d: 'sffdsdfds', e: 'sffdsdfds', f: 'sffdsdfds', g: 'sffdsdfds', status: 'Error' })
    }
  }



  openModal(template: TemplateRef<any>, item: any, type: 's' | 'r', titulo: string = '', mensaje: string = '') {

    try {

      this.titleModal = type == 's' ? 'Solicitud' : 'Respuesta';

      if (type == 's' && item.request || type == 'r' && item.answer) {

        this.currentJson = type === 's'
          ? item.request
          : item.answer

        try {
          const parsedJson = JSON.parse(this.currentJson); // Convertir a objeto

          this.currentJson = parsedJson;
        } catch (error) {
          this.currentJson = this.currentJson;

        }


      } else {
        this.modalService.openStatusMessage(
          'Aceptar',
          `No se encontró ${type === 's' ? 'solicitud' : 'respuesta'}`,
          '3'
        );
        return;
      }


      titulo = ``
      const destroy$: Subject<boolean> = new Subject<boolean>();

      const data: ModalData = {
        content: template,
        btn: '',
        btn2: 'Cerrar',
        footer: true,
        title: titulo,
        type: '',
        message: mensaje,
        image: ''
      };
      const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });


    } catch (error) {
      this.modalService.openStatusMessage(
        'Aceptar',
        `Error al visualiaar la  ${type === 's' ? 'solicitud' : 'respuesta'}`,
        '4'
      );
      console.error(error)
    }


  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Fecha no disponible';

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Fecha no disponible';

    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = ('0' + date.getMinutes()).slice(-2);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convierte 0 a 12 en formato de 12 horas

    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  }

  clean() {

    this.formSearch.get('initialDate')?.setValue(new Date());
    this.formSearch.get('finalDate')?.setValue(new Date());
    this.formSearch.get('listIdProcess')?.setValue('');
    this.formSearch.get('listStatus')?.setValue('');
    this.formSearch.get('internalCodeConsecutive')?.setValue('');
    this.pageNumber = 1;
    this.currentPage = 1;
    this.getLastWeekDate();
    this.cleanChecks();
  }

  cleanChecks() {
    this.checkall = false;
    this.listcheck = [];
  }


  relay() {

    if (this.checkall) {

    } else {

    }

  }

}
