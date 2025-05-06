import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { FileInputComponent } from '@app/shared/inputs/file-input/file-input.component';
import { ToggleComponent } from '@app/shared/inputs/toggle/toggle.component';
import { TablaComunComponent } from '@app/shared/tabla/tabla-comun/tabla-comun.component';
import { MatDialog } from '@angular/material/dialog';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { CategoryService } from '@app/services/parametrizacion/categorias/category.service';
import { ElementsService } from '@app/services/parametrizacion/elements/elements.service';
import { FeaturesService } from '@app/services/parametrizacion/features/features.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { UsersService } from '@app/services/usuarios/users.service';
import { AdmReservasService } from '@app/services/servicios-agendamiento/adm-reservas/adm-reservas.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { Subject, takeUntil, lastValueFrom } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioButton, MatRadioModule } from '@angular/material/radio';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { IReservar } from '@app/shared/interfaces/agendar-cita/agendar-cita.interface';
import { HubService } from '@app/services/hubs/hub.service';

@Component({
  selector: 'app-appointment-manage',
  standalone: true,
  imports: [FormsModule, MatRadioModule, MatRadioButton, MatTooltipModule, NgxPaginationModule, CommonModule, MatIcon, NgClass, ReactiveFormsModule, BasicInputComponent],
  templateUrl: './appointment-manage.component.html',
  styleUrl: './appointment-manage.component.scss'
})
export class AppointmentManageComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  @ViewChild('pre_eliminar') pre_eliminar!: TemplateRef<any>;
  @ViewChild('eliminar') eliminar!: TemplateRef<any>;

  cabeceros: string[] = ['Código de cita', 'Fecha de cita', 'Documento', 'Nombre de paciente', 'Detalle', 'Asistencia', 'Reprogramar', 'Cancelar'];
  TableFilter: any[] = [];
  AdminCitas: any[] = [];
  timeSlots: string[] = [];
  permisosDelModulo: any;
  selectedPatientName: string = '';
  asistence: string = '';
  confirmPatientAttendance: boolean | null = null;
  sede: any[] = [];
  caracteristica: any[] = [];
  currentTime: Date = new Date();
  private timerInterval: any;
  timeBuffer: number = 10;

  datosCita: any;
  idSpecialties: number | null = null;
  idCity: number | null = null;

  formSearch: FormGroup = this.fb.group({
    dateAppointment: [''],
    filterCode: [''],
    FilterDoc: [''],
  });


  formAvanced: FormGroup = this.fb.group({
    firstNamePatient: [''],
    secondNamePatient: [''],
    firstLastNamePatient: [''],
    secondLastNamePatient: ['']
  });

  asistenciaForm: FormGroup = this.fb.group({
    confirmPatientAttendance: [null],
  });

  confirmarEliminacion: FormGroup = this.fb.group({
    confirmar: [null],
  });

  eliminacionForm = this.fb.group({
    motivo: ['', Validators.required]
  })


  isSearch: boolean = false;
  consultaActual: any;

  nombreUsuario: string = this.sharedSVC.obtenerNameUserAction();
  idUser: number = this.sharedSVC.obtenerIdUserAction();

  detailExams: boolean = false;
  listExams: any[] = [];

  citaData: IReservar | undefined;

  itemsPorPagina: number = 5;
  pageNumber: number = 0;
  currentPage: number = 1;
  counter: number = 0;


  constructor(
    private admReservasSvc: AdmReservasService,
    private loaderSvc: LoaderService,
    private sharedSVC: SharedService,
    private modalService: ModalService,
    private fb: FormBuilder,
    private elRef: ElementRef,
    private router: Router,
    private dialog: MatDialog,
    private tzs: TrazabilidadService,
    private hubService: HubService
  ) {
    this.permisosDelModulo = sharedSVC.obtenerPermisosModulo('Administración de citas');
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.citaData = navigation.extras.state['data'];
      this.formSearch.get('dateAppointment')?.setValue(this.citaData?.selectedSchedulingTimes[0].desiredDate);
      setTimeout(() => {
        this.search();
      }, 500);
    } else {
      this.citaData = undefined;
    }


    this.hubService.on('CitaDeleted', (cita: any) => {
      if (this.AdminCitas.length) {
        const index = this.AdminCitas.findIndex(z => z.idAppointment === cita.idAppointment);
        if (index !== -1) {
          this.AdminCitas.splice(index, 1);
        }
      }
    })


    this.hubService.on('CitaConfirm', (cita: any) => {
      let fechaSeleccionada = this.formSearch.get('dateAppointment')?.value;
      let code = this.formSearch.get('filterCode')?.value;
      let document = this.formSearch.get('FilterDoc')?.value;
      if (cita.confirmPatientAttendance) {
        if (fechaSeleccionada || code || document) {
          const index = this.AdminCitas.findIndex(z => z.idAppointment === cita.idAppointment);
          if (index !== -1) {
            this.AdminCitas[index].confirmAttendance = cita.confirmPatientAttendance;
          } else {
            this.search(this.currentPage);
            return
          }
        }
        return;
      }

      if (fechaSeleccionada && code & document) {
        if (
          new Date(fechaSeleccionada).toISOString().split('T')[0] === new Date(cita.desiredDate).toISOString().split('T')[0] &&
          code == cita.internalCode && document == cita.identificationNumber
        ) {
          this.search(this.currentPage);
        }
      }
      else if (fechaSeleccionada && code) {
        if (
          new Date(fechaSeleccionada).toISOString().split('T')[0] === new Date(cita.desiredDate).toISOString().split('T')[0] &&
          code == cita.internalCode
        ) {
          this.search(this.currentPage);
        }
      }
      else if (fechaSeleccionada && document) {
        if (new Date(fechaSeleccionada).toISOString().split('T')[0] === new Date(cita.desiredDate).toISOString().split('T')[0] && document == cita.identificationNumber) {
          this.search(this.currentPage);
        }
      }
      else if (code && document) {
        if (code == cita.internalCode && document == cita.identificationNumber) {
          this.search(this.currentPage);
        }
      } else if (fechaSeleccionada) {

        if (new Date(fechaSeleccionada).toISOString().split('T')[0] === new Date(cita.desiredDate).toISOString().split('T')[0]) {
          this.search(this.currentPage);
        }
      } else if (code) {
        if (code == cita.internalCode) {
          this.search(this.currentPage);
        }
      } else if (document) {
        if (document == cita.identificationNumber) {
          this.search(this.currentPage);
        }
      }

    })
  }

  ngOnInit(): void {
    this.timerInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }


  conectHubs() {

  }
  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  buscarAvanzada(): void {
    this.search(1);
  }

  async search(pagina?: any): Promise<void> {

    this.loaderSvc.show();

    const fechaSeleccionada = this.formSearch.get('dateAppointment')?.value;
    const textoCode = this.formSearch.get('filterCode')?.value?.toLowerCase() || '';
    const textoDoc = this.formSearch.get('FilterDoc')?.value?.toLowerCase() || '';

    if (!fechaSeleccionada && !textoCode && !textoDoc) {
      this.TableFilter = [];
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Aceptar', 'Ingrese información en los filtros', '3')
      return;
    }
    const formValues = this.formAvanced.value;
    const requestData = {
      dateAppointment: fechaSeleccionada ? new Date(fechaSeleccionada).toISOString() : null,
      internalCode: textoCode ? textoCode : null,
      documentPatient: textoDoc ? textoDoc : null,
      firstNamePatient: formValues.firstNamePatient || null,
      secondNamePatient: formValues.secondNamePatient || null,
      firstLastNamePatient: formValues.firstLastNamePatient || null,
      secondLastNamePatient: formValues.secondLastNamePatient || null,
    };

    this.ajustarAlto()
    this.loaderSvc.show();

    if (!pagina) {
      this.AdminCitas = []
      this.currentPage = 1;
    }

    this.consultaActual = requestData;

    const fullRequestData = {
      idSede: 0,
      status: 2,
      pageNumber: pagina ? pagina : 1,
      pageSize: this.itemsPorPagina,
      ...requestData
    };

    try {

      let response = await lastValueFrom(this.admReservasSvc.consultReservations(fullRequestData));
      this.loaderSvc.hide()
      this.isSearch = false;
      if (response.ok && response.data && response.data.Citas && response.data.Citas.length > 0) {

        this.counter = response.data.RegistrosTotales;
        this.AdminCitas = response.data.Citas.map((t: any) => ({
          ...t,
          dateAppointment: this.formatDate(t.dateAppointment)
        })).slice(0, this.itemsPorPagina);
      } else {
        this.modalService.openStatusMessage('Aceptar', 'No se encontraron citas', '3')
        this.AdminCitas = [];
        this.TableFilter = [];
        this.currentPage = 1;
      }

    } catch (error) {
      this.loaderSvc.hide()
      this.modalService.openStatusMessage('Aceptar', 'Error al obtener citas', '4')
    }
  }



  ajustarAlto() {

    const container = this.elRef.nativeElement.querySelector('.principal-cont').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.titulo').offsetHeight;
    const contform = this.elRef.nativeElement.querySelector('.contenedor1').offsetHeight;
    let he = container - header - contform;
    let paginador = he / 30;
    let paginas = Math.floor(paginador / 2);
    this.itemsPorPagina = paginas > 5 ? paginas : 5

  }


  limpiarFiltros(): void {
    this.loaderSvc.show();
    this.formSearch.reset();
    this.TableFilter = [];
    this.AdminCitas = [];
    this.loaderSvc.hide();
  }

  extractTime(time: string): string {
    const date = new Date(`1970-01-01T${time}`);

    if (isNaN(date.getTime())) {
      return 'Hora inválida';
    }

    const optionsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    return date.toLocaleTimeString('es-ES', optionsTime);
  }

  formatDate(fechaISO: string): string {
    const date = new Date(fechaISO);
    const optionsDate: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('es-ES', optionsDate);
  }

  isCurrentAppointment(dateAppointment: string, startTime: string, endTime: string): boolean {
    const now = new Date();
    const [day, month, year] = dateAppointment.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    const appointmentDate = new Date(formattedDate);
    if (isNaN(appointmentDate.getTime())) {
      return false;
    }

    const startDateTime = new Date(`${formattedDate}T${startTime}`);
    const endDateTime = new Date(`${formattedDate}T${endTime}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return false;
    }

    return now >= startDateTime && now <= endDateTime;
  }

  calcularDuracionTooltip(startTime: string, endTime: string): string {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);


    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Hora inválida';
    }

    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    return `Duración: ${diffMinutes} minutos`;
  }


  async ModalDetalle(template: TemplateRef<any>, item: any) {
    const idAppointment = item.idAppointment;

    try {

      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando detalles de la cita' });

      const response = await this.admReservasSvc.detailReservation(idAppointment).toPromise();

      this.loaderSvc.hide();

      if (response && response.data) {
        this.datosCita = response.data.Detalle;
        this.datosCita.duracionCita = this.calcularDuracion(this.datosCita.startTime, this.datosCita.endTime);
        if (response.data.Examenes && response.data.Examenes.length) {
          this.detailExams = true;
          this.listExams = response.data.Examenes.map((exam: any) => { return exam.examName });
        } else {
          this.detailExams = false;
        }
      } else {
        console.error('No se encontraron datos para la cita con ID:', idAppointment);
        this.loaderSvc.hide();
        return;
      }

      const destroy$: Subject<boolean> = new Subject<boolean>();
      const data: ModalData = {
        content: template,
        btn: '',
        btn2: 'Cerrar',
        footer: true,
        type: '',
        image: ''
      };

      const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '1175px', data, disableClose: true });

      dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(() => {
        dialogRef.close();
      });

    } catch (error) {
      console.error('Error al obtener los detalles de la cita:', error);
      this.loaderSvc.hide();
    }
  }

  // calcular la duración de la cita
  calcularDuracion(startTime: string, endTime: string): string {
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

  Asistencia(template: TemplateRef<any>, item: any): void {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '3');
      return;
    }
    if (item.confirmAttendance) {
      this.modalService.openStatusMessage('Aceptar', '¡La asistencia a la cita ya fue confirmada!', '3');
      return;
    }
    this.asistenciaForm.reset();
    this.asistence = item.confirmAttendance;
    this.asistenciaForm.get('confirmPatientAttendance')?.setValue(this.asistence ?? null);
    this.selectedPatientName = item.namePatient;
    const idAppointment = item.idAppointment;



    const data: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: 'Cancelar',
      footer: true,
      type: '',
      image: ''
    };

    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '889px', data, disableClose: true, autoFocus: false });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(this.destroy$)).subscribe(async () => {
      const confirmAttendance = this.asistenciaForm.get('confirmPatientAttendance')?.value;
      if (confirmAttendance !== null) {
        await this.confirmarAsistencia(idAppointment, confirmAttendance);
        dialogRef.close();
      } else {
        this.modalService.openStatusMessage('Aceptar', 'Debe seleccionar una opción antes de confirmar', '3');
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  async confirmarAsistencia(idAppointment: any, confirmAttendance: boolean): Promise<void> {
    try {
      this.loaderSvc.show();
      const data = {
        idAppointment,
        confirmPatientAttendance: confirmAttendance,
        confirmReservation: null
      };

      let response = await this.admReservasSvc.confirmReservation(data).toPromise();
      this.loaderSvc.hide();

      if (response.ok) {
        this.modalService.openStatusMessage('Aceptar', 'Asistencia confirmada exitosamente', '1');
        this.trazabilidadConfirmar(data.idAppointment, data.confirmPatientAttendance)
        this.search(this.currentPage);


      } else {
        this.modalService.openStatusMessage('Aceptar', 'No fue posible confirmar la asistencia', '3');
      }
    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Aceptar', 'Error al confirmar la asistencia', '4');
    }
  }

  Reprogramar(item: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '3');
      return;
    }

    if (item.confirmAttendance) {
      this.modalService.openStatusMessage('Aceptar', '¡La asistencia a la cita ya fue confirmada!', '3');
      return;
    }
    if (String(item.patientTreated) === "1") {
      this.modalService.openStatusMessage('Aceptar', 'La cita no puede ser reprogramada', '3');
      return;
    }


    const idAppointment = item.idAppointment;
    const namePatient = item.namePatient;
    const sedeAppointment = item.sedeAppointment;
    const documentPatient = item.documentPatient;
    const internalCode = item.internalCode;
    sessionStorage.setItem('namePatient', namePatient);
    sessionStorage.setItem('sedeAppointment', sedeAppointment);
    sessionStorage.setItem('documentPatient', documentPatient);
    sessionStorage.setItem('internalCode', internalCode);
    const status = 2;
    this.router.navigate([`inicio/agenda-general/admin-reserva/reprogramar/${status}/${idAppointment}`]);

  }

  confirmarEliminacionModal(item: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '3');
      return;
    }

    if (item.confirmAttendance) {
      this.modalService.openStatusMessage('Aceptar', '¡La asistencia a la cita ya fue confirmada!', '3');
      return;
    }
    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: this.pre_eliminar,
      btn: 'Aceptar',
      btn2: 'Cerrar',
      footer: true,
      type: '',
      image: ''
    };

    // Abrir el modal
    const dialogRef = this.dialog.open(ModalGeneralComponent, {
      height: 'auto',
      width: '40em',
      data,
      disableClose: true
    });

    // Limpiar el formulario de motivo cuando se cierra el modal sin confirmar
    dialogRef.afterClosed().subscribe(() => {
      this.eliminacionForm.reset();
      this.destroy$.next();
      this.destroy$.complete();
    });

    // Cuando el usuario confirma la eliminación
    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async () => {
      dialogRef.close();
      if (this.confirmarEliminacion.get("confirmar")?.value) {
        this.openModalEliminacion(this.eliminar, item);
      } else {
        this.Reprogramar(item);
      }
    });

  }


  openModalEliminacion(template: TemplateRef<any>, item: any) {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para cancelar la cita', '3');
      return;
    }

    if (item.confirmAttendance) {
      this.modalService.openStatusMessage('Aceptar', '¡La asistencia a la cita ya fue confirmada!', '3');
      return;
    }

    const idAppointment = item.idAppointment;
    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: 'Cerrar',
      footer: true,
      type: '',
      image: ''
    };

    // Abrir el modal
    const dialogRef = this.dialog.open(ModalGeneralComponent, {
      height: 'auto',
      width: '40em',
      data,
      disableClose: true
    });

    // Limpiar el formulario de motivo cuando se cierra el modal sin confirmar
    dialogRef.afterClosed().subscribe(() => {
      this.eliminacionForm.reset();
      this.destroy$.next();
      this.destroy$.complete();
    });

    // Cuando el usuario confirma la eliminación
    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async () => {
      if (this.eliminacionForm.valid) {
        await this.cancelarCita(idAppointment);
        dialogRef.close();
      } else {
        this.eliminacionForm.markAllAsTouched();
      }
    });
  }



  async cancelarCita(idAppointment: any) {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para cancelar la cita', '4');
      return;
    }



    const reasonElimination = this.eliminacionForm.get('motivo')?.value;
    const data = { idAppointment, reasonElimination };

    this.loaderSvc.show();

    try {
      this.loaderSvc.text.set({ text: 'Eliminando cita' });

      let response = await this.admReservasSvc.deleteCita(data).toPromise();
      this.loaderSvc.hide();

      if (response.ok) {
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
        this.modalService.openStatusMessage('Aceptar', 'Cita cancelada exitosamente', '1');

        //Trazabilidad
        this.trazabilidadEliminar(idAppointment);
        // Recargar citas con los filtros actuales
        this.search(this.currentPage);



      } else {
        this.modalService.openStatusMessage('Aceptar', 'No fue posible cancelar la cita', '3');
      }
    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Aceptar', 'Error al cancelar la cita', '4');
    }
  }


  handlePageChange(page: number) {
    this.currentPage = page;
    this.search(this.currentPage);

  }


  busquedaAvanzadaModal(template: TemplateRef<any>): void {
    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: template,
      btn: 'Buscar',
      btn2: 'Cerrar',
      footer: true,
      message: '',
      image: ''
    };

    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(() => {
      this.buscarAvanzada();
      dialogRef.close();
    });
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
      subModulo: "Administración de citas"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }


  trazabilidadEliminar(idAppointment: number) {
    //Trazabilidad

    let configuracion = this.AdminCitas.find((e: any) => e.idAppointment == idAppointment);

    let nuevoEvent = {

      idAppointment: configuracion.idAppointment,
      sedeAppointment: configuracion.sedeAppointment,
      address: configuracion.address,
      confirmAttendance: configuracion.confirmAttendance,
      iconName: configuracion.iconName,
      specialConditionName: configuracion.specialConditionName,
      documentPatient: configuracion.documentPatient,
      categoryName: configuracion.categoryName,
      characteristicName: configuracion.characteristicName,
      specialtiesName: configuracion.specialtiesName,
      elementName: configuracion.elementName,
      namePatient: configuracion.namePatient,
      dateAppointment: configuracion.dateAppointment,
      startTime: configuracion.startTime,
      endTime: configuracion.endTime,
      confirmPatientAttendance: false,
      idUserAction: this.idUser,
      fullNameUserAction: this.nombreUsuario,
      reasonElimination: this.eliminacionForm.get('motivo')?.value
    }

    this.trazabilidad(nuevoEvent, null, 3, 'Eliminación');

    //fin traza
  }

  trazabilidadConfirmar(idAppointment: any, asistio: boolean) {

    //Trazabilidad
    let antes: any;
    let despues: any;

    let configuracion = this.AdminCitas.find((e: any) => e.idAppointment == idAppointment);

    let obj = {

      idAppointment: configuracion.idAppointment,
      sedeAppointment: configuracion.sedeAppointment,
      address: configuracion.address,
      iconName: configuracion.iconName,
      specialConditionName: configuracion.specialConditionName,
      documentPatient: configuracion.documentPatient,
      categoryName: configuracion.categoryName,
      characteristicName: configuracion.characteristicName,
      specialtiesName: configuracion.specialtiesName,
      elementName: configuracion.elementName,
      namePatient: configuracion.namePatient,
      dateAppointment: configuracion.dateAppointment,
      startTime: configuracion.startTime,
      endTime: configuracion.endTime,
      fullNameUserAction: configuracion.fullNameUserAction,
      idUserAction: configuracion.idUserAction,
      confirmPatientAttendance: false,
      AttendedPunctuall: false
    }


    antes = { ...obj }
    despues = { ...obj }
    despues.confirmPatientAttendance = true;
    despues.AttendedPunctually = asistio;
    despues.fullNameUserAction = this.nombreUsuario
    despues.idUserAction = this.idUser
    this.trazabilidad(antes, despues, 2, 'Edición');


  }


}
