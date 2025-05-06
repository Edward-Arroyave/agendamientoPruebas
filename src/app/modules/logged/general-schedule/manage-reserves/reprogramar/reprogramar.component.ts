import {
  Component,
  ElementRef,
  HostListener,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  Renderer2,
  TemplateRef,
} from '@angular/core';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TarjetaPacienteComponent } from '../../../../../shared/tabla/tarjeta-paciente/tarjeta-paciente.component';
import { Subject, takeUntil } from 'rxjs';
import { ModalData } from '../../../../../shared/globales/Modaldata';
import { ModalGeneralComponent } from '../../../../../shared/modals/modal-general/modal-general.component';
import { AdmReservasService } from '@app/services/servicios-agendamiento/adm-reservas/adm-reservas.service';
import { FormatTimePipe } from '@app/pipes/format-time.pipe';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { LoggedComponent } from '@app/modules/logged/logged.component';

import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { HubService } from '@app/services/hubs/hub.service';

@Component({
  selector: 'app-reprogramar',
  standalone: true,
  imports: [
    DatePipe,
    FormatTimePipe,
    CommonModule,
    ReactiveFormsModule,
    BasicInputComponent,
    TarjetaPacienteComponent,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'es' }],
  templateUrl: './reprogramar.component.html',
  styleUrl: './reprogramar.component.scss',
})
export class ReprogramarComponent implements OnInit, OnDestroy {
  status: number = 1;
  formSearch = this.fb.group({
    desiredDate: ['', Validators.required],
  });

  idCity: number | null = null;
  idCountry: number | null = null;
  idSpecialties: number | null = null;
  horarios: any[] = [];
  headers = [
    'Paciente:',
    'Entidad remitente:',
    'Categoría:',
    'Especialidad:',
    'Característica:',
    'Elemento:',
    'Condición:',
  ];
  subHeaders: string[] = [];
  characteristicName: any;
  categoryName: any;
  specialtiesName: any;
  elementName: any;
  specialCondition: any;
  sedeAppointment: string | null;
  idAppointment: number | null = null;
  idElement: any;
  idTypeAttention: any;
  idAttentionCenter: any;
  idCharacteristic: any;
  internalCode: string = '';
  patientDocument: string = '';
  fullNamePatient: string = '';

  minDate: any = new Date();
  fechaMaximaPorCreatinina: any = undefined;
  diasVigenciaCreatinina: number | undefined = undefined;
  isPatient: boolean = false;

  currentReservation: any;
  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();
  haveExams: boolean = false;

  constructor(
    private modalService: ModalService,
    private admReservasSvc: AdmReservasService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private modalSvc: ModalService,
    private loaderSvc: LoaderService,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private sharedSvc: SharedService,
    private logged: LoggedComponent,
    private shadedSVC: SharedService,
    private tzs: TrazabilidadService,
    private hubService: HubService
  ) {

    this.sedeAppointment = sessionStorage.getItem('sedeAppointment') || '';




    this.route.params.subscribe((params) => {
      this.status = +params['status'];
      this.idAppointment = +params['idAppointment'];
      this.obtenerDetallesCita();
    });

    this.hubService.on('Cita', (cita: any) => {
      if (this.horarios.length) {
        let sede = cita.data.attentionCenterName
        let characteristic = cita.data.idCharacteristic
        const fechaCita = new Date(cita.data.desiredDate).toISOString().split('T')[0];
        this.horarios = this.horarios.filter((a: any) => {
          return (
            this.idCharacteristic !== characteristic ||
            a.sede !== sede ||
            new Date(a.desiredDate).toISOString().split('T')[0] !== fechaCita ||
            a.startTime !== cita.data.startTime ||
            a.endTime !== cita.data.endTime
          );
        });

      }
    })
  }
  ngOnDestroy(): void {
    sessionStorage.removeItem('sedeAppointment');
  }

  ngOnInit(): void {
    if (this.logged.isPatient) {
      this.isPatient = true;
    } else {
      this.isPatient = false;
    }
    this.formSearch.get('desiredDate')?.valueChanges.subscribe((fecha) => {
      if (fecha && this.idSpecialties && this.idCity) {
        this.obtenerDisponibilidadCitas(this.formatDateForAPI(fecha));
      } else {
        console.error(
          'Los IDs de especialidad o ciudad no están disponibles o aún no han sido cargados.'
        );
      }
    });
  }


  @HostListener('window:resize', ['$event'])
  Resolucion(): void {
    setTimeout(() => this.ajustarAlto(), 100);
  }

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  obtenerDetallesCita(): void {
    if (!this.idAppointment) return;
    this.loaderSvc.show();
    this.admReservasSvc.detailReservation(this.idAppointment).subscribe(
      (response: any) => {
        this.loaderSvc.hide();
        const cita = response?.data.Detalle;
        this.currentReservation = response?.data.Detalle;
        if (cita) {
          this.asignarDatosCita(cita);
          this.verificarCreatinina(cita);
        } else {
          console.error(
            'No se encontraron datos para la cita con ID:',
            this.idAppointment
          );
        }
      },
      (error) => {
        console.error('Error al obtener los detalles de la cita:', error);
        this.loaderSvc.hide();
      }
    );
  }

  verificarCreatinina(cita: any) {
    if (cita.creatinineResultDate) {
      let diasSiguientes = cita.daysParticular;
      const fechaBase = new Date(cita.creatinineResultDate);
      if (diasSiguientes > 0) {
        // Sumar los días a la fecha base
        this.fechaMaximaPorCreatinina = new Date(
          fechaBase.setDate(fechaBase.getDate() + diasSiguientes)
        );
        this.diasVigenciaCreatinina = diasSiguientes;
      } else {
        this.fechaMaximaPorCreatinina = fechaBase;
        this.diasVigenciaCreatinina = 0;
      }
    } else {
      this.fechaMaximaPorCreatinina = undefined;
      this.diasVigenciaCreatinina = undefined;
    }
  }

  obtenerDisponibilidadCitas(fecha: string): void {

    this.horarios = [];
    const data: any = {
      idCity: this.idCity,
      desiredDate: fecha,
      idTypeAttention: this.idTypeAttention,
      idCountry: this.idCountry,
      haveExams: this.haveExams,
      idAttentionCenter: this.idAttentionCenter
    };
    if (this.idElement) {
      data.idElement = this.idElement;
    } else {
      data.idSpecialties = this.idSpecialties;
    }

    this.loaderSvc.show();
    this.admReservasSvc.dispCita(data).subscribe(
      (response) => {
        this.loaderSvc.hide();
        if (response.ok && response.data) {
          let horario = response.data.flatMap((element: any) =>
            element.listDisponibilityAppointment
              .filter((cita: any) =>
                this.sharedSvc.EsRangoValido(
                  cita.desiredDate,
                  cita.startTime,
                  this.fechaMaximaPorCreatinina
                )
              )
              .map((cita: any) => ({
                ...cita,
                sede: element.sede,
                idCharacteristic: element.idCharacteristic,
                characteristicName: element.characteristicName,
                idAgenda: element.idAgenda,
                cups: element.cups || '',
                idSede: element.idSede
              }))
          );

          if (this.isPatient) {
            horario = horario.filter((cita: any) => {
              return cita.isSufficient
            })
          }


          //Validar de que la fecha deseada no se pase de la creatinina
          if (this.fechaMaximaPorCreatinina) {
            const hoy = new Date(); // Fecha actual
            const fechaMaxima = new Date(this.fechaMaximaPorCreatinina); // Aseguramos que sea una instancia de Date
            const fechaSeleccionada = new Date(fecha);
            // Comparar sólo fechas (ignorando horas)
            hoy.setHours(0, 0, 0, 0);
            fechaMaxima.setHours(0, 0, 0, 0);

            if (fechaMaxima < hoy || fechaSeleccionada > fechaMaxima) {
              this.modalService.openStatusMessage(
                'Aceptar',
                'La fecha seleccionada es mayor a la vigencia del resultado de la creatinina ' +
                `(${this.diasVigenciaCreatinina} día${this.diasVigenciaCreatinina === 1 ? '' : 's'
                })`,
                '4'
              );
              this.horarios = [];
              return;
            }
          }
          this.horarios = horario;
        }
      },
      (error) => {
        console.error('Error al obtener la disponibilidad de citas:', error);
        this.loaderSvc.hide();
      }
    );
  }

  private ajustarAlto(): void {
    const elements = [
      '.container',
      '.title',
      '.subtitle',
      '.form-search',
      '.encabezado',
      '.horarios',
    ].map((selector) => this.elRef.nativeElement.querySelector(selector));

    if (elements.every((el) => el)) {
      const [container, title, subtitle, form, encabezado, horarios] = elements;
      const height =
        container.offsetHeight -
        title.offsetHeight -
        subtitle.offsetHeight -
        form.offsetHeight -
        encabezado.offsetHeight -
        105;
      this.renderer.setStyle(horarios, 'height', `${height}px`);
    } else {
      console.warn(
        'Algunos elementos no existen en el DOM, no se puede ajustar el alto.'
      );
    }
  }

  cancelar() {
    if (this.status === 1) {
      this.router.navigate(['/inicio/agenda-general/admin-reserva']);
    } else if (this.status === 2) {
      this.router.navigate(['/inicio/agenda-general/admin-citas']);
    }
  }

  openModalConfirmar(template: TemplateRef<any>, dispo: any, item: any): void {
    const { startTime, endTime, desiredDate } = dispo;
    const { idAgenda } = item;

    //  instancia del pipe manual
    const formatTimePipe = new FormatTimePipe();

    // pipe para formatear las horas de inicio y fin
    const horaInicio = formatTimePipe.transform(startTime);
    const horaFin = formatTimePipe.transform(endTime);

    const datePipe = new DatePipe('es-ES');
    const fechaFormateada = datePipe.transform(desiredDate, 'fullDate');
    const reservationData = {
      idAppointment: this.idAppointment,
      idAgenda,
      idElement: this.idElement,
      idTypeAttention: this.idTypeAttention,
      desiredDate: dispo.desiredDate,
      startTime: dispo.startTime,
      endTime: dispo.endTime,
      sede: dispo.sede,
      idSede: dispo.idSede,
      characteristicName: dispo.characteristicName,
      idCharacteristic: dispo.idCharacteristic,
      cups: dispo.cups
    };

    const modalData: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: 'Cerrar',
      footer: true,
      message: `Se agendo para el día ${fechaFormateada}, de ${horaInicio} a ${horaFin}. ¿Está seguro que desea reprogramar su reserva en este horario?`,
      type: '2',
      image: '',
    };

    this.abrirModalReprogramacion(modalData, reservationData);
  }

  private abrirModalReprogramacion(
    modalData: ModalData,
    reservationData: any
  ): void {
    const dialogRef = this.dialog.open(ModalGeneralComponent, {
      height: 'auto',
      width: '40em',
      data: modalData,
      disableClose: true,
    });

    dialogRef.componentInstance.primaryEvent
      ?.pipe(takeUntil(new Subject<boolean>()))
      .subscribe(() => {
        this.reprogramarCita(reservationData);
        dialogRef.close();
      });
  }

  private reprogramarCita(reservationData: any): void {

    this.loaderSvc.show();
    this.admReservasSvc.GenerarReprogramacion(reservationData).subscribe({
      next: (response) => {
        this.loaderSvc.hide();
        if (response.ok) {
          this.generateTrazaReprogramation(reservationData)

          let elemento = ''
          if (this.internalCode && this.elementName) {
            elemento = this.internalCode + " " + this.elementName;
          } else {
            if (this.elementName) {
              elemento = this.elementName;
            }
          }

          //Trazabilidad historico de citas
          this.tzs.crearTrazabilidadCitaHistorico(this.patientDocument,
            reservationData.idSede || 0, this.nombreUsuario, 2,
            reservationData.desiredDate, reservationData.startTime, elemento, reservationData.idAppointment);
          this.modalService.openStatusMessage(
            'Aceptar',
            '¡Cita reprogramada en el sistema correctamente!',
            '1'
          );
          const ruta =
            this.status === 1
              ? '/inicio/agenda-general/admin-reserva'
              : '/inicio/agenda-general/admin-citas';
          this.router.navigate([ruta]);
        } else {
          this.modalService.openStatusMessage(
            'Aceptar',
            'Error al reprogramar la cita',
            '3'
          );
        }
      },
      error: (error) => {
        console.error('Error al reprogramar la cita:', error);
        this.modalService.openStatusMessage(
          'Aceptar',
          'Error al reprogramar la cita',
          '4'
        );
        this.loaderSvc.hide();
      },
    });
  }

  private asignarDatosCita(cita: any): void {

    // const idAppointment = item.idAppointment;
    // const namePatient = item.namePatient;
    // const sedeAppointment = item.sedeAppointment;
    // const documentPatient = item.documentPatient;
    // const internalCode = item.internalCode;
    // sessionStorage.setItem('namePatient', namePatient);
    // sessionStorage.setItem('sedeAppointment', sedeAppointment);
    // sessionStorage.setItem('documentPatient', documentPatient);
    // sessionStorage.setItem('', internalCode);
    const {
      idCity,
      idSpecialties,
      categoryName,
      specialtiesName,
      characteristicName,
      elementName,
      specialCondition,
      idElement,
      idTypeAttention,
      idCountry,
      idAttentionCenter,
      idCharacteristic,
      internalCode,
      patientDocument,
      fullNamePatient
    } = cita;

    Object.assign(this, {
      idCity,
      idSpecialties,
      categoryName,
      specialtiesName,
      characteristicName,
      elementName,
      specialCondition,
      idElement,
      idTypeAttention,
      idCountry,
      idAttentionCenter,
      idCharacteristic,
      internalCode,
      patientDocument,
      fullNamePatient
    });
    if (cita.idExam && cita.idExam.length > 0) {
      this.haveExams = true;
    }

    this.subHeaders = [
      this.fullNamePatient,
      this.sedeAppointment,
      this.categoryName,
      this.specialtiesName,
      this.characteristicName,
      this.elementName,
      this.specialCondition,
    ];
  }

  private formatDateForAPI(dateStr: string): string {
    return new Date(dateStr).toISOString().split('T')[0];
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

  trazabilidad(antes: any, despues: any | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 1,
      idMovimiento,
      modulo: "Agenda general",
      movimiento,
      subModulo: "Reprogramación"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  generateTrazaReprogramation(newReservation: any) {
    if (!this.isPatient) {
      let dataAntes = this.currentReservation;
      let dataDespues = newReservation;

      let antes = {
        idAppointment: dataAntes.idAppointment,
        desiredDate: dataAntes.desiredDate,
        startTime: dataAntes.startTime,
        endTime: dataAntes.endTime,
        attentionCenterName: dataAntes.attentionCenterName,
        fullNameUserAction: dataAntes.fullNameUserAction,
        idUserAction: dataAntes.idUserAction
      }

      let despues = {
        idAppointment: dataDespues.idAppointment,
        desiredDate: dataDespues.desiredDate,
        startTime: dataDespues.startTime,
        endTime: dataDespues.endTime,
        attentionCenterName: dataDespues.sede,
        fullNameUserAction: this.nombreUsuario,
        idUserAction: this.idUser
      }

      this.trazabilidad(antes, despues, 2, 'Edición');
    }
  }
}
