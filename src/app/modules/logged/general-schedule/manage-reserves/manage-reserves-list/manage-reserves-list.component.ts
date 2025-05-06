import { AuthService } from '@app/services/autenticacion/auth..service';
import { Component, ElementRef, HostListener, Renderer2, TemplateRef } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { MatDialog } from '@angular/material/dialog';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { ModalData } from '../../../../../shared/globales/Modaldata';
import { ModalGeneralComponent } from '../../../../../shared/modals/modal-general/modal-general.component';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { AdmReservasService } from '@app/services/servicios-agendamiento/adm-reservas/adm-reservas.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { MatTooltipModule } from '@angular/material/tooltip';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { IAdmReserva } from '@app/shared/interfaces/agendamiento/AdministracionReservas.interface';
import { HubService } from '@app/services/hubs/hub.service';

@Component({
  selector: 'app-manage-reserves-list',
  standalone: true,
  imports: [MatIcon, NgClass, ReactiveFormsModule, MatTooltipModule, BasicInputComponent, NgxPaginationModule],
  templateUrl: './manage-reserves-list.component.html',
  styleUrl: './manage-reserves-list.component.scss'
})
export class ManageReservesListComponent {

  private destroy$ = new Subject<void>();
  formulario = this.fb.group({
    idSede: ['', Validators.required],
    dateAppointment: [''],
    documentPatient: [''],
    status: [1]
  })

  consultaActual: any = {};
  registrosTotales = 0;



  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  eliminacionForm = this.fb.group({
    motivo: ['', [Validators.required, Validators.minLength(5)]]
  })
  form2 = this.fb.group({
    firstNamePatient: [''],
    secondNamePatient: [''],
    firstLastNamePatient: [''],
    secondLastNamePatient: ['']
  })

  listSedes: any[] = [];
  listCodes: any[] = [];
  codesDocuments: any[] = [];
  codesPatients: any[] = [];
  reservas: any[] = [];

  isSearch: boolean = false;



  data: any[] = [];

  itemsPorPagina: number = 5;
  pageNumber: number = 0;
  currentPage: number = 1;
  counter: number = 0;



  cabeceros: string[] = ['Sede', 'Código reserva', 'Fecha de reserva', 'Documento', 'Nombre del paciente', 'Detalle', 'Reprogramar', 'Cancelar'];

  archivos: any[] = []
  detalleCabezeros: any[] = [
    'Duración de la cita', 'Tipo de atención', 'Categoría', 'Especialidad', 'Caracteristica', 'Elemento', 'Condición especial', 'Dirección'
  ]
  detalleIcons: any[] = [
    'reloj', 'tipoAtencion', 'categoria', 'especialidad', 'caracteristica', 'elemento', 'condicion-especial', 'sede'
  ]
  detalleBody: any[] = []

  permisosDelModulo: any;

  transactionStatus: string = 'Confirmado';
  citaData: any | undefined = undefined

  constructor(private fb: FormBuilder,
    private dialog: MatDialog,
    private modalSvc: ModalService,
    private shadedSVC: SharedService,
    private loaderSvc: LoaderService,
    private router: Router,
    private admReservasSvc: AdmReservasService,
    private elRef: ElementRef,
    private tzs: TrazabilidadService,
    private hubService: HubService,
    private renderer: Renderer2

  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Administración de reservas')

    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.citaData = navigation.extras.state['data'];
    } else {
      this.citaData = undefined
    }

    this.hubService.on('Cita', (cita: any) => {
      if (this.reservas.length) {
        let sede = cita.data.idAttentionCenter
        if (this.fv.idSede && this.fv.idSede == sede) {
          this.search(this.currentPage);
        }
      }
    })

    this.hubService.on('CitaConfirm', (cita: any) => {
      if (this.reservas.length) {
        const index = this.reservas.findIndex(z => z.idAppointment === cita.idAppointment);
        if (index !== -1) {
          this.reservas.splice(index, 1);
        }
      }
    })

    this.hubService.on('CitaDeleted', (cita: any) => {
      if (this.reservas.length) {
        const index = this.reservas.findIndex(z => z.idAppointment === cita.idAppointment);
        if (index !== -1) {
          this.reservas.splice(index, 1);
        }
      }
    })
  }

  async ngOnInit(): Promise<void> {
    await this.getSedes()
    if (this.citaData) {
      let data = this.citaData.selectedSchedulingTimes[0];
      this.fc.idSede.setValue(data.idSede || '')
      this.fc.dateAppointment.setValue(data.desiredDate || '')
      this.fc.documentPatient.setValue(data.identification || '')
      this.search(this.currentPage);
    }
  }

  get fv() {
    return this.formulario.value
  }
  get fc() {
    return this.formulario.controls
  }

  get fv2() {
    return this.form2.value
  }



  async getSedes() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando sedes' })
      let items = await this.shadedSVC.getSedes().toPromise();
      this.loaderSvc.hide()
      if (items.ok && items.data) {
        this.listSedes = items.data;
      }
    } catch (error) {
      this.loaderSvc.hide()
    }

  }

  async search(pageNumber?: any) {

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return
    }

    try {
      this.isSearch = true;
      this.loaderSvc.show()
      this.ajustarAlto()
      this.loaderSvc.text.set({ text: 'Cargando reservas' })
      if (!pageNumber) {
        this.reservas = []
        this.currentPage = 1;
      }
      let filter: any = {
        idSede: this.fv.idSede,
        status: 1
      }
      if (this.fv.dateAppointment) filter.dateAppointment = this.fv.dateAppointment
      if (this.fv.documentPatient) filter.documentPatient = this.fv.documentPatient?.trim()
      if (this.fv2.firstNamePatient) filter.firstNamePatient = this.fv2.firstNamePatient?.trim()
      if (this.fv2.secondNamePatient) filter.secondNamePatient = this.fv2.secondNamePatient?.trim()
      if (this.fv2.firstLastNamePatient) filter.firstLastNamePatient = this.fv2.firstLastNamePatient?.trim()
      if (this.fv2.secondLastNamePatient) filter.secondLastNamePatient = this.fv2.secondLastNamePatient?.trim()
      filter.pageNumber = pageNumber ? pageNumber : 1
      filter.pageSize = this.itemsPorPagina
      // filter.idPatient = 0

      this.consultaActual = filter;
      let response = await this.admReservasSvc.consultReservations(filter).toPromise();
      this.loaderSvc.hide()
      this.isSearch = false;
      if (response.ok && response.data) {
        this.counter = response.data.RegistrosTotales;
        this.reservas = response.data.Citas.map((t: any) => ({
          ...t,
          dateAppointmentFormatted: `${this.formatDate(t.dateAppointment)} ${this.formatTime(t.startTime)}`,
          namePatient: this.transformName(t.namePatient)
        })).slice(0, this.itemsPorPagina);
      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'No se encontraron reservas', '3')
        this.reservas = []
        this.currentPage = 1;
      }
    } catch (error) {
      this.isSearch = false;
      this.reservas = []
      this.currentPage = 1;
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', 'Error al cargar las reservas', '4')
    }

  }

  handlePageChange(event: number) {
    this.currentPage = event;
    this.search(event)
  }

  reprogramar(item: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '3');
      return;
    }


    sessionStorage.setItem('sedeAppointment', item.sedeAppointment);

    const status = 1;
    this.router.navigate([`inicio/agenda-general/admin-reserva/reprogramar/${status}/${item.idAppointment}`]);
  }

  async openModal(template: TemplateRef<any>, type: string, idReserva: any, titulo: string = '', mensaje: string = '') {


    if (type == 'detail') {
      let r = await this.generDetalle(idReserva)
      if (!r) return

    } else {
      this.archivos = [];
      let archivos: any[] = []
      //0 - MedicalAuthorization, 1 - MedicalOrder, 2 - ClinicHistory
      for (let i = 0; i <= 2; i++) {
        let r = await this.getFiles(idReserva, i)
        switch (i) {
          case 0:
            archivos.push({
              name: 'Autorización Médica',
              filename: r ? 'Abrir archivo' : 'Sin archivo',
              file: r
            });
            break;
          case 1:
            archivos.push({
              name: 'Orden Médica',
              filename: r ? 'Abrir archivo' : 'Sin archivo',
              file: r
            });
            break;
          case 2:
            archivos.push({
              name: 'Historia Clínica',
              filename: r ? 'Abrir archivo' : 'Sin archivo',
              file: r
            });
            break;

          default:
            break;
        }

      }
      let anyFile = archivos.find(e => e.file != null);
      if (!anyFile) {
        return this.modalSvc.openStatusMessage('Aceptar', 'No se encontraron archivos relacionados a la reserva', '3')
      }
      this.archivos = archivos;


    }


    const destroy$: Subject<boolean> = new Subject<boolean>();
    /* Variables  recibidas por el modal */
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
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '50em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      dialogRef.close();
    });
  }


  async generDetalle(idReserva: any): Promise<boolean> {
    try {
      this.loaderSvc.show()
      this.detalleBody = []
      this.loaderSvc.text.set({ text: 'Consultando detalle' })
      let response = await lastValueFrom(this.admReservasSvc.detailReservation(idReserva))
      this.loaderSvc.hide()
      if (response.ok) {
        let data = response.data.Detalle;
        this.detalleBody = []
        for (let i = 0; i < this.detalleCabezeros.length; i++) {
          let obj: any = {
            titulo: this.detalleCabezeros[i],
            icono: this.detalleIcons[i]
          }
          const subtitulos = [
            this.calcularDuracion(data.startTime, data.endTime),
            data.idTypeAttention == 2 ? 'Virtual' : 'Presencial',
            data.categoryName ? data.categoryName : '-',
            data.specialtiesName ? data.specialtiesName : '-',
            data.characteristicName ? data.characteristicName : '-',
            data.elementName ? data.elementName : '-',
            data.specialCondition ? data.specialCondition : '-',
            data.address ? data.address : '-',
          ];
          this.transactionStatus = data.statusName || 'Sin estado';
          obj.subtitulo = subtitulos[i];
          this.detalleBody.push(obj)

        }
        return true;


      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'No fue posible consultar el detalle', '3')
        return false;
      }
    } catch (error) {
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', 'Error al consultar el detalle', '4')
      return false;
    }


  }


  async getFiles(idReserva: any, idType: any) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando archivos' })
      let response = await lastValueFrom(this.admReservasSvc.getFiles(idReserva, idType))
      this.loaderSvc.hide()
      if (response.ok) {
        return response.data;

      } else {
        //   this.modalSvc.openStatusMessage('Aceptar', 'No se encontraron archivos', '3')
        return null;
      }
    } catch (error) {
      this.loaderSvc.hide()
      //   this.modalSvc.openStatusMessage('Aceptar', 'Error al consultar los archivos', '4')
      return null;
    }
  }

  openPdf(base64String: string): void {
    try {
      // Elimina el prefijo 'data:application/octet-stream;base64,' de la cadena Base64
      const base64Data = base64String.split(',')[1];
      // Decodifica el Base64 a bytes binarios
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // Crea un blob con los bytes del PDF
      const blob = new Blob([bytes], { type: 'application/pdf' });
      // Crea una URL para el blob
      const url = window.URL.createObjectURL(blob);
      // Abre el PDF en una nueva pestaña
      window.open(url);
    } catch (error) {
      this.modalSvc.openStatusMessage('Aceptar', 'Error al abrir el archivo', '4')
    }

  }

  limpiar() {
    this.formulario.reset();
    this.form2.reset();
    this.fc.status.setValue(1);
    this.reservas = [];
    this.isSearch = false;
  }


  // calcular la duración de la cita
  public calcularDuracion(startTime: string, endTime: string): string {
    if (!startTime || !endTime) {
      return 'No disponible';
    }

    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'No disponible';
    }

    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Fecha no disponible';

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Fecha no disponible';

    const day = ('0' + date.getDate()).slice(-2);
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  formatTime(timeStr: string): string {
    ;
    if (!timeStr) return 'Hora no disponible';

    // Validar formato "HH:mm:ss"
    const timeParts = timeStr.split(':');
    if (timeParts.length !== 3) return 'Hora no disponible';

    let hours = parseInt(timeParts[0], 10);
    const minutes = ('0' + timeParts[1]).slice(-2);
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convertir la hora al formato de 12 horas
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;

  }



  busquedaAvanzadaModal(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {
    if (!this.fv.idSede) {
      this.modalSvc.openStatusMessage('Aceptar', 'Debe ingresar una sede', '3')
      return
    }


    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: template,
      btn: 'Buscar',
      btn2: 'Cerrar',
      footer: true,
      title: titulo,
      type: '',
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async x => {

      if (this.fv2.firstNamePatient || this.fv2.secondNamePatient || this.fv2.firstLastNamePatient || this.fv2.secondLastNamePatient) {

        this.search();
      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'Ingrese nombres o apellidos', '3')
        return
      }

      dialogRef.close();

    });
  }

  openModalCancelacion(template: TemplateRef<any>, item: any) {

    if (!this.permisosDelModulo.Eliminar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para cancelar la reserva', '3');
      return
    }
    const idAppointment = item.idAppointment
    this.eliminacionForm.get('motivo')?.reset();
    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: 'Cerrar',
      footer: true,
      type: '',
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async x => {
      if (this.eliminacionForm.valid) {
        await this.cancelarReserva(idAppointment)
        dialogRef.close();
      } else {
        this.eliminacionForm.markAllAsTouched();
      }
    });
  }




  async cancelarReserva(idAppointment: any) {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para cancelar la reserva', '4');
      return;
    }

    const reasonElimination = this.eliminacionForm.get('motivo')?.value;
    const data = { idAppointment, reasonElimination };

    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cancelando reserva' })
      let response = await this.admReservasSvc.deleteReservations(data).toPromise();
      this.loaderSvc.hide()
      if (response.ok) {

        //Trazabilidad
        this.trazabilidadEliminar(idAppointment);
        //fin traza
        this.loaderSvc.show()
        //Trazabilidad historico de citas
        let detail = await lastValueFrom(this.admReservasSvc.detailReservation(idAppointment))
        this.loaderSvc.hide()
        if (detail.ok) {
          let data = detail.data.Detalle;
          let elemento = data.internalCode + " " + data.elementName;

          this.tzs.crearTrazabilidadCitaHistorico(data.patientDocument,
            data.idAttentionCenter || 0, this.nombreUsuario, 3,
            data.desiredDate, data.startTime, elemento, idAppointment);
        }

        this.modalSvc.openStatusMessage('Aceptar', '¡Reserva cancelada en el sistema correctamente!', '1')

        this.formulario.patchValue(this.consultaActual);
        await this.search();
      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'No fue posible cancelar la reserva', '3')
      }
    } catch (error) {
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', 'Error al cancelar la reserva', '4')
    }

  }

  modalConfirmar(template: TemplateRef<any>, item: any) {
    // Verificar permisos antes de abrir el modal
    if (!this.permisosDelModulo.Editar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '3');
      return;
    }

    // Formatear fecha y hora
    const fecha = this.formatDate(item.dateAppointment);
    const hora = item.startTime.slice(0, -3)

    const titulo = `¿Está seguro que desea confirmar la reserva de este paciente para el día ${fecha} a las ${hora}?`;

    // Configuración del modal
    const data: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: 'Cancelar',
      footer: true,
      title: titulo,
      type: '2',
      message: '',
      image: ''
    };

    // Abrir el modal
    const dialogRef = this.dialog.open(ModalGeneralComponent, {
      height: 'auto',
      width: '40em',
      data,
      disableClose: true
    });

    // Escuchar el evento de aceptación del modal
    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(this.destroy$)).subscribe(async () => {
      await this.confirmarCita(item);
      dialogRef.close();
    });

    // Limpiar el Subject cuando se cierre el modal
    dialogRef.afterClosed().subscribe(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }


  async confirmarCita(item: IAdmReserva) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Confirmando reserva' })

      let reserva = {
        idAppointment: item.idAppointment,
        confirmReservation: true,
        confirmPatientAttendance: null,
        idUserAction: this.idUser,
        fullNameUserAction: this.shadedSVC.obtenerNameUserAction()
      }
      let response = await this.admReservasSvc.confirmReservation(reserva).toPromise();
      this.loaderSvc.hide()
      if (response.ok) {
        this.trazabilidadConfirmar(item)
        this.modalSvc.openStatusMessage('Aceptar', '¡Reserva confirmada en el sistema correctamente!', '1')
        this.formulario.patchValue(this.consultaActual);
        await this.search();
      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'No fue posible confirmar la reserva', '3')
      }
    } catch (error) {
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', 'Error al confirmar la reserva', '4')
    }
  }


  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.currentPage = 1;
      this.ajustarAlto()
    }, 100)
  }




  ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.contenedor1').offsetHeight;
    const title = this.elRef.nativeElement.querySelector('.titulo').offsetHeight;
    let he = container - header - title;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.table-content'), 'height', `${he - 50}px`);
    let paginador = he / 30;
    let paginas = Math.floor(paginador / 2);
    this.itemsPorPagina = paginas > 5 ? paginas : 5
    if (this.formulario.valid && !this.isSearch) {
      this.search();
    }

  }


  transformName(name: string): string {
    // Verificar si el nombre contiene solo letras y espacios, si no, retornar el nombre sin cambios
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return name;
    }

    // Transformar a formato deseado
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  //Funcion para trazabilidad///

  trazabilidad(antes: any, despues: any | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 1,
      idMovimiento,
      modulo: "Agenda general",
      movimiento,
      subModulo: "Administración de reservas"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  trazabilidadConfirmar(item: any) {
    //Trazabilidad
    let antes: any;
    let despues: any;

    let obj =
    {
      idAppointment: item.idAppointment,
      namePatient: item.namePatient,
      sedeAppointment: item.sedeAppointment,
      categoryName: item.categoryName,
      characteristicName: item.characteristicName,
      specialtiesName: item.specialtiesName,
      elementName: item.elementName,
      dateAppointment: item.dateAppointment,
      startTime: item.startTime,
      endTime: item.endTime,
      confirmReservation: false,
      fullNameUserAction: item.fullNameUserAction,
      idUserAction: item.idUserAction
    }

    antes = { ...obj }
    despues = { ...obj }
    despues.confirmreservation = true;
    despues.fullNameUserAction = this.nombreUsuario
    despues.idUserAction = this.idUser
    this.trazabilidad(antes, despues, 2, 'Edición');


  }

  trazabilidadEliminar(idAppointment: number) {
    //Trazabilidad

    let configuracion = this.reservas.find((e: any) => e.idAppointment == idAppointment);
    let nuevoEvent: any = JSON.parse(JSON.stringify(configuracion));
    nuevoEvent.idUserAction = this.idUser;
    nuevoEvent.fullNameUserAction = this.nombreUsuario;
    this.trazabilidad(nuevoEvent, null, 3, 'Eliminación');

    //fin traza
  }

}
