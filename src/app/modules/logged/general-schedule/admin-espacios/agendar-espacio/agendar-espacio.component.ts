import { CdkScrollable } from '@angular/cdk/scrolling';
import { DatePipe, JsonPipe, NgClass, NgSwitch, NgSwitchCase, NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, input, LOCALE_ID, Output, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormatTimePipe } from '@app/pipes/format-time.pipe';
import { ModalData } from '@app/shared/globales/Modaldata';
import { IReservar, ListDisponibilityAppointment } from '@app/shared/interfaces/agendar-cita/agendar-cita.interface';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Step1Component } from '../../schedule-an-appointment/steps/step-1/step-1.component';
import { Step2Component } from '../../schedule-an-appointment/steps/step-2/step-2.component';
import { ModalService } from '@app/services/modal/modal.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { StepEspaciosComponent } from "../../schedule-an-appointment/steps/step-espacios/step-espacios.component";
import { Step6Component, VisualCardPaso6 } from "../../schedule-an-appointment/steps/step-6/step-6.component";
import { PreparationsService } from '@app/services/parametrizacion/preparations/preparations.service';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { AgendarCitaService } from '@app/services/servicios-agendamiento/agendar-cita/agendar-cita.service';
import { Router } from '@angular/router';
import moment from 'moment';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { Categoria } from '../../../../../shared/interfaces/parametrizacion/categoria.model';
import { ExamsLaboratoryService } from '@app/services/exams-laboratory/exams-laboratory.service';
import { IPacienteHis } from '@app/shared/interfaces/usuarios/paciente-his.model';
import { AdmReservasService } from '@app/services/servicios-agendamiento/adm-reservas/adm-reservas.service';
import { IAdmReserva } from '@app/shared/interfaces/agendamiento/AdministracionReservas.interface';
import { MercadoPagoService } from '@app/services/mercado-pago/mercado-pago.service';
import { ICostoExamen } from '@app/shared/interfaces/payment-gateway/payment-gateway.model';
import { MonitorService } from '@app/services/interoperability/monitor/monitor.service';
import { AuthService } from '@app/services/autenticacion/auth..service';
import { PaymentGatewayService } from '@app/services/payment-gateway/payment-gateway.service';
import { ListElementContracts } from '@app/shared/interfaces/parametrizacion/elementos.model';
import { ElementsService } from '@app/services/parametrizacion/elements/elements.service';

@Component({
  selector: 'app-agendar-espacio',
  standalone: true,
  imports: [
    MatIconModule,
    NgClass,
    MatTooltipModule,
    NgSwitchCase,
    NgSwitch,
    NgTemplateOutlet,
    CdkScrollable,
    DatePipe,
    FormatTimePipe,
    Step1Component,
    Step2Component,
    StepEspaciosComponent,
    Step6Component,
    MatRadioButton,
    MatRadioGroup
  ],
  // providers:[
  //   {provide:LOCALE_ID, useValue:'es'}
  // ],
  templateUrl: './agendar-espacio.component.html',
  styleUrl: './agendar-espacio.component.scss'
})
export class AgendarEspacioComponent {
  @Output() cancel: EventEmitter<any> = new EventEmitter<boolean>;
  @Output() cancelConPendientes: EventEmitter<any> = new EventEmitter<[]>;

  @Input() infoConsulta!: FormGroup;
  @Input() contratoRemitido: any;
  @Input() dataGeneral: any;
  @Input() nephroprotection: any;
  @Input() itemAgenda: any;
  @Input() pacienteLlenado: any;
  @Input() formRemitidoLlenado: any;
  @Input() pacienteParticularFlagLlenada: any;
  @Input() listaIdExamenesSelected: any[] = [];

  @Input() espaciosRemitidoFlag!: boolean;

  paymentSede: boolean = true;

  tabs: any = [
    { id: 1, number: 1, name: 'Datos', completed: false },
    { id: 2, number: 2, name: 'Entidad', completed: false },
    { id: 3, number: 3, name: 'Agenda', completed: false },
    { id: 3, number: 4, name: 'Confirmación', completed: false },
  ]
  currentTabId: number = 1;

  listaDePreparaciones: any[] = [];
  listaSelectedIdExam: number[] = [];

  formParametros: FormGroup = this.fb.group({
    desiredDate: [, []],
    idTypeAttention: [, [Validators.required]],

    fechaCreatina: [, []],
    resultCreatina: [, []],

    idElement: [, []],
    idSpecialties: [, []],
    idCity: [, []],
  })

  form: FormGroup = this.fb.group({
    idIdentificationType: [, [Validators.required]],
    identificationNumber: [, [Validators.required]],
    name: [{ value: null, disabled: true }, [Validators.required],],
    lastName: [{ value: null, disabled: true }, [Validators.required]],
    birthDate: [{ value: null, disabled: true }, [Validators.required]],
    email: [{ value: null, disabled: true }, [Validators.required]],
    idBiologicalSex: [{ value: null, disabled: true }, [Validators.required]],
    adress: [{ value: null, disabled: true }, []],
    phone: [{ value: null, disabled: true }, [Validators.required]],
    phone2: [{ value: null, disabled: true }, []],
  });


  formRemitido: FormGroup = this.fb.group({
    idOriginEntity: [, [Validators.required]],
    plan: [, [Validators.required]],
    medicalAuthorization: [, []],
    dateAuthorization: [, []],
    medicalOrder: [, []],
    dateOrder: [, []],
    clinicHistory: [, []],
    dateHistory: [, []],
  });

  pacienteRemitidoFlag: boolean = false;
  verPacienteParticular: boolean = true;
  associatedExam: boolean = true;
  paciente!: IPacienteHis;


  listaAgendaSeleccionada: ListDisponibilityAppointment[] = [];
  listaRequerimientos: any;

  reserva!: IReservar;
  informacionPaso4: any[] = [];
  observaciones: string = '';
  procedimientoAgendamiento!: VisualCardPaso6
  cita!: IReservar
  listaDocumentos: any[] = [];
  observacionesText: string | null = null;

  @ViewChild('requisitos') requisitosTemplate!: TemplateRef<any>;
  @ViewChild('reservas') reservasTemplate!: TemplateRef<any>;
  @ViewChild('agendar') agendarTemplate!: TemplateRef<any>;

  nombreUsuario: string = this.sharedSVC.obtenerNameUserAction();
  idUser: number = this.sharedSVC.obtenerIdUserAction();
  idPatient: number = 0;
  contractCode: string = "";
  internalCode: string = "";

  formButtonCompanion = new FormControl(false);

  //Formulario del acompañante!
  formCompanion: FormGroup = this.fb.group({
    idIdentificationType: [, [Validators.required]],
    identificationNumber: [, [Validators.required]],
    name: ['', [Validators.required]],
    adress: ['', [Validators.required]],
    telephone: ['', [Validators.required]],
    email: ['', [Validators.email, Validators.required]],
    idRelationShip: ['', [Validators.required]]
  });

  constructor(
    private dialog: MatDialog,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private fb: FormBuilder,
    private agendarCitaSvc: AgendarCitaService,
    private modalService: ModalService,
    private loaderSvc: LoaderService,
    private preparationsService: PreparationsService,
    private router: Router,
    private sharedSVC: SharedService,
    private tzs: TrazabilidadService,
    private examService: ExamsLaboratoryService,
    private admReservasSvc: AdmReservasService,
    private mercadoPagoService: MercadoPagoService,
    private monitorService: MonitorService,
    private authSvc: AuthService,
    private paymentGatewayService: PaymentGatewayService,
    private elementsService: ElementsService
  ) {

  }

  ngAfterViewInit() {
    this.ajustarAlto();
    let tokenDecoded = this.authSvc.decodeToken();
    this.idPatient = parseInt(tokenDecoded.IdPatient[1]);
  }



  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container-agendamiento').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.title').offsetHeight;
    const tabs = this.elRef.nativeElement.querySelector('.tabs-container').offsetHeight;
    let he = container - header - tabs - 70;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.contenido-tab'), 'height', `${he}px`);
  }



  async ngOnInit(): Promise<void> {

    this.procedimientoAgendamiento = {
      iconName: this.itemAgenda[0].iconName,
      categoryName: this.itemAgenda[0].categoryName,
      specialtiesName: this.itemAgenda[0].specialtiesName,
      specialConditionName: this.itemAgenda[0].specialConditionName,
      elementName: this.itemAgenda[0]?.elementName || null,
    }



    this.listaAgendaSeleccionada = this.itemAgenda;
    this.pacienteRemitidoFlag = this.pacienteParticularFlagLlenada;
    !this.pacienteRemitidoFlag ? this.contractCode = this.contratoRemitido : '';
    if (this.pacienteLlenado) {
      this.paciente = this.pacienteLlenado;
      this.formRemitido.setValue(this.formRemitidoLlenado.value)
      this.currentTabId = 3;
    }

    let categoria: Categoria[] = this.dataGeneral.categorias;
    this.associatedExam = categoria.find(y => y.idCategory === Number(this.itemAgenda[0].idCategory))?.associatedExam!;
    this.contratoParticular();
    await this.getDocuments();
  }

  async obtenerElemento(idElement: number) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando contrato' })
      const result = await lastValueFrom(this.elementsService.getElementos({ idElement }));
      if (result.ok) {
        this.internalCode = result.data.internalCode;
      } else {
        this.modalService.openStatusMessage('Cancelar', 'No se encontró el elemento', '4')
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Cancelar', 'No se encontró el elemento', '4')
    }
  }

  async contratoParticular() {
    try {
      const costo = await lastValueFrom(this.paymentGatewayService.contratoParticular());
      this.contractCode = costo.data.particularContractCode;
    } catch (error) {
      this.modalService.openStatusMessage('Cancela', 'No se encontro el contrato particular', '4');
    }
  }

  async getDocuments() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando tipos de documento...' })
      let documents = await lastValueFrom(this.sharedSVC.documentsTypes());
      if (documents.data) {
        this.listaDocumentos = documents.data;
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }

  }

  async obtenerCostoExamen() {
    try {
      const costo = await lastValueFrom(this.mercadoPagoService.obtenerCostoExamen(this.internalCode, this.itemAgenda[0].cups!, this.contractCode));
      return JSON.parse(costo.data).data;
    } catch (error) {
      return [];
    }
  }

  async crearControl(idAppointment: number, preferencia: any, idStatus: number = 1) {
    this.idUser = this.sharedSVC.obtenerIdUserAction();
    const obj = {
      consecutiveOwn: "",
      idAppointment,
      idStatus,
      idUser: this.idUser,
      statusName: 'Pendiente',
      idProcess: 5,
      APIManagement: "Mercado Pago",
      request: JSON.stringify(preferencia),
    }
    await lastValueFrom(this.monitorService.crearMonitorPagos(obj))
  }


  async inicializarMercadoPago(idAppointment: number) {
    this.loaderSvc.show();
    this.loaderSvc.text.set({ text: 'Cargando mercado pago...' })
    const documento = this.paciente.identificationNumber.split('-');
    try {
      const examen: ICostoExamen[] = await this.obtenerCostoExamen();
      if (examen == null) {
        this.dialog.closeAll();
        this.modalService.openStatusMessage("cancelar", 'Ha ocurrido un error inesperado', '4');
        return
      }
      const preferencia = {
        item: [
          ...examen.map(x => {
            return {
              id: x.instServiceCode,
              title: x.instServiceName,
              unitPrice: x.value,
              quantity: 1,
              description: 'Pago por servicio de salud agendamiento web',
              eventDate: moment().toDate()
            }
          })
        ],
        payerEmail: this.paciente.email,
        documentType: documento[0],
        document: documento[1],
        idAppointment,
        agendaType: 2,
        fullName: `${this.paciente.patientName} ${this.paciente.patientLastNames}`
      }
      let result = await lastValueFrom(this.mercadoPagoService.crearPreferencia(preferencia));

      if (result.ok) {
        await this.crearControl(idAppointment, result);
        if (this.sharedSVC.obtenerPermisosModulo('Administración de reservas').Ver) {
          this.router.navigate(['/inicio/agenda-general/admin-reserva'], { state: { data: this.cita } });
        }
        this.dialog.closeAll(); this.dialog.closeAll();
        this.modalService.openStatusMessage('Cancelar', 'Se ha creado el agendamiento correctamente, se le enviará un correo al paciente con toda la información', '1');
        this.loaderSvc.hide();
      } else {
        await this.crearControl(idAppointment, result, 3);
        console.error(result.message);
        this.loaderSvc.hide();
        this.dialog.closeAll();
        this.modalService.openStatusMessage('Cancelar', 'Ha ocurrido un error, lo sentimos', '4');
      }
    } catch (error: any) {
      await this.crearControl(idAppointment, { ok: false, message: error }, 3);
      this.dialog.closeAll();
      this.loaderSvc.hide();
      this.dialog.closeAll();
      this.modalService.openStatusMessage("Cancelar", "Ha ocurrido un error inesperado :" + error.error, "4");
    }
  }


  cancelar() {
    this.cancel.emit(true)
  }
  cancelarConPendientes(pendientes: any) {
    this.cancelConPendientes.emit(pendientes)
  }

  anterior() {
    this.loaderSvc.show();
    if (this.currentTabId > 1) this.currentTabId -= 1;
    if (this.currentTabId === 1) this.verPacienteParticular = true;
    if (this.currentTabId === 2) {
      // this.pacienteParticularFlag = false;
      if (!this.espaciosRemitidoFlag) {
        this.tabs[this.currentTabId - 1].completed = false;
        this.tabs[this.currentTabId].completed = false;
        this.currentTabId = 1;
        return;
      }
    }
    if (this.currentTabId !== 1) this.tabs[this.currentTabId - 1].completed = false;

    this.loaderSvc.hide();
  }



  async siguiente(value?: any | null) {
    switch (this.currentTabId) {
      case 1:
        if (this.form.invalid) {
          return this.modalService.openStatusMessage('Cancelar', 'Por favor complete los campos', '4')
        }
        if (!this.espaciosRemitidoFlag) {
          this.tabs[this.currentTabId - 1].completed = true;
          this.tabs[this.currentTabId].completed = true;
          if (this.currentTabId < 4) this.currentTabId += 2;
          return;
        }
        this.tabs[this.currentTabId - 1].completed = true;
        if (this.currentTabId < 4) this.currentTabId += 1
        break;
      case 3:
        if (this.infoConsulta.valid) {
          this.modalRequisitos(this.requisitosTemplate);
        } else {
          this.infoConsulta.markAllAsTouched();
          return this.modalService.openStatusMessage('Cancelar', 'Por favor complete los campos', '4')
        }

        break;
      case 4:

        this.modalReservar(this.agendarTemplate);

        break;

      default:
        break;
    }
  }


  modalAgendar(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {
    if (this.listaDePreparaciones.find(x => x.checked === false)) {
      if (this.listaDePreparaciones.filter(x => x.listRequirements === null).length !== this.listaDePreparaciones.length) {
        return this.modalService.openStatusMessage('Cancelar', 'Por favor confirmar la/s preparación/es para la cita, en el recuadro "He leído la preparación"', '3', undefined, '500px');
      }
    }
    const destroy$: Subject<boolean> = new Subject<boolean>();
    const data: ModalData = {
      content: template,
      btn: this.pacienteRemitidoFlag ? 'Confirmar' : undefined,
      btn2: 'Cancelar',
      footer: true,
      title: titulo,
      message: mensaje,
      image: '',
      type: '1'
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '48em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {

      this.crearReserva();
      dialogRef.close();
    });

    dialogRef.componentInstance.secondaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      location.reload();
      dialogRef.close();
    });
  }

  async confirmarCita(item: any) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Confirmando reserva' })

      let reserva = {
        idAppointment: item.idAppointment,
        confirmReservation: true,
        confirmPatientAttendance: null
      }
      let response = await this.admReservasSvc.confirmReservation(reserva).toPromise();
      this.loaderSvc.hide()
      if (response.ok) {

      } else {
        this.modalService.openStatusMessage('Aceptar', 'No fue posible confirmar la reserva', '3')
      }
    } catch (error) {
      this.loaderSvc.hide()
      this.modalService.openStatusMessage('Aceptar', 'Error al confirmar la reserva', '4')
    }
  }


  async crearReserva(paymentSede?: boolean) {

    try {
      const textSuccess = "Se ha creado el agendamiento correctamente, se le enviará un correo al paciente con toda la información";
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Generando reserva de la cita' });
      !paymentSede ? paymentSede = false : '';
      this.cita.paymentSede = paymentSede;
      const resp = await lastValueFrom(this.agendarCitaSvc.crearReserva(this.cita));
      this.loaderSvc.hide()
      if (resp.ok) {
        const dataConfirmar: IAdmReserva = {
          idAppointment: resp.data.data.idAppointment,
          confirmReservation: true,
          confirmPatientAttendance: false
        }
        this.trazabilidadCrearReserva()
        let elemento = ''
        if (this.internalCode && this.itemAgenda[0]?.elementName) {
          elemento = this.internalCode + " " + this.itemAgenda[0]?.elementName;
        } else {
          if (this.itemAgenda[0]?.elementName) {
            elemento = this.itemAgenda[0]?.elementName;
          }
        }
        let datosCita: any = this.cita.selectedSchedulingTimes[0]
        //Buscar el tipo de documento:
        let documentPatient = this.form.get('identificationNumber')?.value
        let document = this.listaDocumentos.find(x => x.idDocumentType == this.form.get('idIdentificationType')?.value);
        if (document) {
          let texto = document.documentType;
          const tipoDocumento = texto.split('-')[0].trim().toUpperCase(); // "cc"
          documentPatient = tipoDocumento + '-' + documentPatient;
        }

        this.tzs.crearTrazabilidadCitaHistorico(documentPatient,
          datosCita.idSede || 0, this.nombreUsuario, 1,
          datosCita.desiredDate, datosCita.startTime, elemento, resp.data.data.idAppointment);

        if (this.itemAgenda[0].pendientes && this.itemAgenda[0].pendientes.length) {
          let data = {
            pendientes: this.itemAgenda[0].pendientes,
            infoPaciente: this.paciente,
            formRemitido: this.formRemitido,
            pacienteParticularFlag: this.pacienteRemitidoFlag
          }
          this.cancelarConPendientes(data)
          this.dialog.closeAll();
          await this.confirmarCita(dataConfirmar);
          this.loaderSvc.hide();
          return
        }

        this.formCompanion.reset();
        this.formButtonCompanion.setValue(false);
        if (this.associatedExam) {
          await this.confirmarCita(dataConfirmar);
          if (this.sharedSVC.obtenerPermisosModulo('Administración de citas').Ver) {
            this.dialog.closeAll();
            this.modalService.openStatusMessage('Cancelar', textSuccess, '1');
            this.router.navigate(['/inicio/agenda-general/admin-citas'], { state: { data: this.cita } });
          } else {
            if (this.sharedSVC.obtenerPermisosModulo('Administración de reservas').Ver) {
              this.router.navigate(['/inicio/agenda-general/admin-reserva'], { state: { data: this.cita } });
              this.dialog.closeAll();
              this.modalService.openStatusMessage('Cancelar', textSuccess, '1');
            } else {
              this.modalService.openStatusMessage('Cancelar', 'Reserva creada en el sistema correctamente', '1');
              setTimeout(() => {
                location.reload();
              }, 1000);
            }
          }
          this.dialog.closeAll();
          this.loaderSvc.hide();
          return
        } else {
          if (!this.pacienteRemitidoFlag && this.itemAgenda[0]?.elementName) {
            if (!paymentSede) {

              try {
                await this.inicializarMercadoPago(resp.data.data.idAppointment);
              } catch (error) {
                this.modalService.openStatusMessage('Cancelar', String(error), '4');
                this.loaderSvc.hide();
                return
              }

            } else {
              await this.confirmarCita(dataConfirmar);
              if (this.sharedSVC.obtenerPermisosModulo('Administración de reservas').Ver) {
                this.router.navigate(['/inicio/agenda-general/admin-reserva'], { state: { data: this.cita } });
              }
              this.dialog.closeAll();
              this.modalService.openStatusMessage('Cancelar', textSuccess, '1');
              this.loaderSvc.hide();
            }
          } else {
            if (this.sharedSVC.obtenerPermisosModulo('Administración de reservas').Ver) {
              this.dialog.closeAll();
              this.modalService.openStatusMessage('Cancelar', textSuccess, '1');
              this.router.navigate(['/inicio/agenda-general/admin-reserva'], { state: { data: this.cita } });
            } else {
              this.modalService.openStatusMessage('Cancelar', 'Reserva creada en el sistema correctamente', '1');
              setTimeout(() => {
                location.reload();
              }, 1000);
            }
          }
        }
        this.loaderSvc.hide();
        return
      } else {
        this.dialog.closeAll();
        this.modalService.openStatusMessage('Cancelar', resp.message, '4');
      }
      this.loaderSvc.hide();

    } catch (error) {
      this.dialog.closeAll();
      this.modalService.openStatusMessage('Cancelar', 'No se pudo realizar la reserva', '4');
      this.loaderSvc.hide()
    }

  }

  siguienteRemitido() {
    if (this.formRemitido.invalid) {
      return this.modalService.openStatusMessage('Cancelar', 'Por favor complete los campos', '4')
    }
    this.tabs[this.currentTabId - 1].completed = true;
    if (this.currentTabId < 6) this.currentTabId += 1;
    setTimeout(() => {
      this.scrollTop()
    }, 200);
  }

  scrollTop() {
    let div = document.getElementById('scrolllTop');
    if (div) div.scrollTop = 0;
  }

  get fullName() {
    return this.paciente.patientName + ' ' + this.paciente.patientLastNames;
  }


  async getDetailRequisitosNoLab(dataDetail: any) {

    try {
      this.loaderSvc.show()
      const resp = await lastValueFrom(this.preparationsService.getDetail(dataDetail));
      this.loaderSvc.hide()
      if (resp.ok) {
        this.listaRequerimientos = [resp.data];
        this.informacionPaso4 = this.listaRequerimientos;
      } else {
        this.modalService.openStatusMessage('Cancelar', 'Ha ocurrido un error inesperado', '4');
      }

    } catch (error) {
      console.error(error);

    }
  }

  async getRequisitosLaboratorio(examList: string) {
    try {
      this.listaSelectedIdExam = [];
      await lastValueFrom(this.examService.getExamRequeriments(examList)).then(x => {
        this.listaRequerimientos = x.data.map((x: any) => {
          if (this.listaIdExamenesSelected.includes(x.idExam)) {
            this.listaSelectedIdExam.push(x.idExam);
            return x
          }
          return false
        }).filter((y: any) => y);
        this.informacionPaso4 = [...this.listaRequerimientos];
      })
    } catch (error) {
      this.listaSelectedIdExam = [];
      console.error(error)
    }
  }

  async getDetailRequisitos(dataDetail: any) {

    try {
      if (this.associatedExam) {
        await this.getRequisitosLaboratorio(new Array(this.infoConsulta.getRawValue().listIdExamens).join(','));
      } else {
        await this.getDetailRequisitosNoLab(dataDetail);
      }
    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  async modalRequisitos(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {

    let flagSinListaRequisitos = true;
    const dataDetail = {
      idCharacteristic: this.infoConsulta.getRawValue().idCharacteristic,
      idElement: this.infoConsulta.getRawValue().idElement
    }

    await this.getDetailRequisitos(dataDetail);

    if (!this.associatedExam) {
      if (this.listaRequerimientos[0].procedureRequirements == null) {
        let i = await this.devolverCita();
        if (i) {
          setTimeout(() => {
            this.scrollTop()
          }, 200);
          this.tabs[this.currentTabId - 1].completed = true;
          if (this.currentTabId < 4) this.currentTabId += 1
        }

        return
      }
    } else {
      this.listaRequerimientos.forEach((lista: any) => {
        if (lista.listRequirements) flagSinListaRequisitos = false;
      });
      if (this.associatedExam && flagSinListaRequisitos) {
        let i = await this.devolverCita();
        if (i) {
          this.modalReservar(this.reservasTemplate)
        }
        return
      }
    }

    const destroy$: Subject<boolean> = new Subject<boolean>();
    const data: ModalData = {
      content: template,
      btn: 'Guardar',
      btn2: 'Cerrar',
      footer: true,
      title: titulo,
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '60em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async x => {


      let flagRequisitos = true;

      const mensajeAdvertencia = "La agenda no puede ser reservada, debido a que no se cumplen los requisitos de la cita. Por favor comuníquese al correo soporte@ithealth.co o a la linea (601)2372691 para confirmar la información o validar la agenda.";

      if (!this.associatedExam) {
        if (this.listaRequerimientos[0].procedureRequirements !== null) {
          this.listaRequerimientos[0].procedureRequirements.forEach((element: any) => {
            if (element.essentialRequirement && !element.checked) {
              flagRequisitos = false
            }
          });
        }
      } else {

        this.listaRequerimientos.forEach((lista: any) => {
          if (lista.listRequirements) {
            lista.listRequirements.map((element: any) => {
              if (element.essentialRequirement && !element.checked) {
                flagRequisitos = false;
                return;
              }
              flagSinListaRequisitos = false;
            })
          }
        });

      }

      if (!flagRequisitos) return this.modalService.openStatusMessage('Cancelar', mensajeAdvertencia, '3');
      let i = await this.devolverCita();

      if (i) {
        this.modalReservar(this.reservasTemplate)
      }
      dialogRef.close();
    });
  }

  async devolverCita() {
    let entidad = this.formRemitido.value.idOriginEntity === null ? null : this.formRemitido.value;
    let nuevaObjEntidad = entidad;
    let clinicHistory = this.formRemitido.value.clinicHistory;
    let dateHistory = this.formRemitido.value.dateHistory;
    let medicalOrder = this.formRemitido.value.medicalOrder;
    let dateOrder = this.formRemitido.value.dateOrder;
    let medicalAuthorization = this.formRemitido.value.medicalAuthorization;
    let dateAuthorization = this.formRemitido.value.dateAuthorization;
    const base = "data:application/pdf;base64,";
    if (entidad !== null) {
      nuevaObjEntidad = {
        idOriginEntity: this.formRemitido.value.idOriginEntity,
        clinicHistory: clinicHistory !== null ? base + clinicHistory : null,
        dateHistory: dateHistory !== null ? dateHistory : null,
        medicalAuthorization: medicalAuthorization !== null ? base + medicalAuthorization : null,
        dateAuthorization: dateAuthorization !== null ? dateAuthorization : null,
        dateOrder: dateOrder !== null ? dateOrder : null,
        medicalOrder: medicalOrder !== null ? base + medicalOrder : null
      }
    }

    let valorCreatinina: string | null = null;
    if (this.nephroprotection.specialConditionName == "Contrastado") {
      valorCreatinina = String(this.calcularCreatinina());
    }

    if (valorCreatinina == "0") {
      const mensajeAdvertencia = "La agenda no puede ser reservada, debido a que no se cumplen los requisitos de la cita. Por favor comuníquese al correo soporte@ithealth.co o a la linea (601)2372691 para confirmar la información o validar la agenda.";
      this.modalService.openStatusMessage('Cancelar', mensajeAdvertencia, '3', undefined, '50em');
      return false;
    }

    this.pacienteRemitidoFlag ? this.contractCode = this.formRemitido.get('plan')?.value : "";
    this.infoConsulta.getRawValue().idElement ? await this.obtenerElemento(this.infoConsulta.getRawValue().idElement) : "";

    this.cita =
    {
      idPatient: Number(this.paciente.idPatient),
      idPatientType: this.pacienteRemitidoFlag ? Number(2) : Number(1),
      idSpecialties: this.infoConsulta.getRawValue().idSpecialties!,
      creatinineResultDate: this.infoConsulta.getRawValue().creatinineResultDate,
      creatinineResult: valorCreatinina,
      meetsRequirements: true,
      originEntity: nuevaObjEntidad,
      statusPayment: 'pending',
      contract: this.contractCode,
      attentionCenterHomologate: 'TR_HORISOESII',// TODO --- HOMOLOGACION
      idInstService: this.internalCode,
      paymentSede: true,
      selectedSchedulingTimes: this.listaAgendaSeleccionada.map(x => {
        const nuevoElemento = {
          idAgenda: this.itemAgenda[0].idAgenda,
          idElement: this.infoConsulta.getRawValue().idElement,
          idTypeAttention: this.infoConsulta.getRawValue().idTypeAttention,
          listIdExam: this.listaSelectedIdExam.length ? this.listaSelectedIdExam.join(',') : undefined,
          desiredDate: x.desiredDate,
          startTime: x.startTime,
          endTime: x.endTime,
          sede: x.sede,
          idSede: this.itemAgenda[0].idSede,
          identification: this.paciente.identificationNumber.split('-')[1],
          cups: x.cups ? x.cups : '',
          idCharacteristic: x.idSpecialties,
          characteristicName: x.specialtiesName
        };
        return nuevoElemento;
      })
    };
    if (this.formCompanion.valid && this.formButtonCompanion.value) {
      this.cita.companionPatient = {
        name: this.formCompanion?.get('name')?.value.trim(),
        idIdentificationType: this.formCompanion?.get('idIdentificationType')?.value,
        identificationNumber: this.formCompanion?.get('identificationNumber')?.value,
        adress: this.formCompanion?.get('adress')?.value.trim(),
        telephone: Number(this.formCompanion?.get('telephone')?.value),
        email: this.formCompanion?.get('email')?.value.trim(),
        idRelationShip: this.formCompanion?.get('idRelationShip')?.value
      }
    }
    this.informacionPaso4 = [...this.listaRequerimientos]
    return true;
  }

  modalReservar(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {
    const destroy$: Subject<boolean> = new Subject<boolean>();
    const data: ModalData = {
      content: template,
      btn: 'Guardar',
      btn2: 'Cerrar',
      footer: true,
      title: titulo,
      message: mensaje,
      image: '',
      type: '2'
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '48em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {

      setTimeout(() => {
        this.scrollTop()
      }, 200);
      this.tabs[this.currentTabId - 1].completed = true;
      if (this.currentTabId < 4) this.currentTabId += 1
      dialogRef.close();
    });
  }


  formula(variableValue: number, divisor: number, dividendo: number, exponente: number, base: number, edad: number): number {
    return variableValue * Math.pow(divisor / dividendo, exponente) * Math.pow(base, edad);
  }

  procedimientoCreatinina(keyOperador: string, resultado: number, keyValue1: string, keyValue2?: string): number {
    const procedimiento: any = this.nephroprotection;
    const mensaje = 'El resultado de la creatitina no esta dentro del rango requerido';
    if (!keyValue2) {
      if (procedimiento[keyOperador]) {
        if (procedimiento[keyOperador] === 1) {
          if (resultado < procedimiento[keyValue1]) {
            if (keyValue1 !== 'valuesMin') return resultado;
            this.modalService.openStatusMessage('Cancelar', mensaje, '4')
            return 0;
          }
        }
        if (procedimiento[keyOperador] === 2) {
          if (procedimiento[keyValue1] === resultado) {
            if (keyValue1 !== 'valuesMin') return resultado;
            this.modalService.openStatusMessage('Cancelar', mensaje, '4')
            return 0;
          }
        }
        if (procedimiento[keyOperador] === 3) {
          if (resultado < procedimiento[keyValue1]) {
            if (keyValue1 !== 'valuesMin') return resultado;
            this.modalService.openStatusMessage('Cancelar', mensaje, '4')
            return 0;
          }
        }
      }
    } else {
      if (procedimiento[keyOperador]) {
        if (procedimiento[keyValue1] > resultado && procedimiento[keyValue1] < resultado) {
          if (keyValue1 !== 'valuesMin') return resultado;
          this.modalService.openStatusMessage('Cancelar', mensaje, '4')
          return 0;
        }
      }
    }
    return resultado;
  }

  calcularCreatinina(): number {
    const sexo = this.paciente.biologicalSex;
    this.observacionesText = null;
    let resultado: number = 0;
    let variableValue: number = 0;
    let dividendo: number = 0;
    let base: number = 0.993;
    let divisor: number = Number(this.infoConsulta.get('creatinineResult')?.value);

    const nacimiento = moment(this.paciente.birthDate, 'DD-MM-YYYY');
    const hoy = moment();
    const edad = hoy.diff(nacimiento, 'years');

    if (sexo === 'Mujer') { // mujeres
      variableValue = 144;
      dividendo = 0.7;
      if (divisor <= dividendo) resultado = this.formula(variableValue, divisor, dividendo, -0.329, base, edad);
      if (divisor > dividendo) resultado = this.formula(variableValue, divisor, dividendo, -1.209, base, edad);
    } else if (sexo === 'Hombre') { //hombres
      variableValue = 141;
      dividendo = 0.9;
      if (divisor <= dividendo) resultado = this.formula(variableValue, divisor, dividendo, -0.411, base, edad);
      if (divisor > dividendo) resultado = this.formula(variableValue, divisor, dividendo, -1.209, base, edad);
    }

    console.log('Creatinina : ', resultado);

    const arrKeys: any[] = ['idOperatorMin', 'idOperatorMax', 'idOperatorInter'];
    const arrValues: any[] = ['valuesMin', 'valuesMax', 'valuesInter'];

    for (let index = 0; index < [1, 2, 3].length; index++) {
      if (index !== 2) resultado = this.procedimientoCreatinina(arrKeys[index], resultado, arrValues[index]);
      if (index === 2) resultado = this.procedimientoCreatinina(arrKeys[index], resultado, arrValues[index] + '1', arrValues[index] + '2');
      if (resultado === 0) break;
    }
    if (this.nephroprotection?.idOperatorInter) {
      if (resultado > this.nephroprotection.valuesInter1! && resultado < this.nephroprotection.valuesInter2!) {
        this.observacionesText = this.nephroprotection.observations!;
      }
    }
    return resultado;
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
      subModulo: "Administración de espacios"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }


  trazabilidadCrearReserva() {
    //Trazabilidad
    let valorCreatinina: any = null
    if (this.nephroprotection.specialConditionName == "Contrastado") {
      valorCreatinina = String(this.calcularCreatinina());
    }


    let datosCita: any = this.cita.selectedSchedulingTimes[0]
    let nuevoEvent = {
      idAgenda: datosCita.idAgenda,
      typeAttention: datosCita.idTypeAttention == '1' ? 'Presencial' : 'Virtual',
      desiredDate: datosCita.desiredDate,
      startTime: datosCita.startTime,
      endTime: datosCita.endTime,
      identification: this.paciente.identificationNumber,
      sede: datosCita.sede,
      iconName: this.itemAgenda[0].iconName,
      categoryName: this.itemAgenda[0].categoryName,
      specialtiesName: this.itemAgenda[0].specialtiesName,
      specialConditionName: this.itemAgenda[0].specialConditionName,
      elementName: this.itemAgenda[0]?.elementName || null,
      patientName: this.fullName,
      idUserAction: this.idUser,
      fullNameUserAction: this.nombreUsuario,
      dateAuthorization: this.formRemitido.get('dateAuthorization')?.value,
      dateOrder: this.formRemitido.get('dateOrder')?.value,
      dateHistory: this.formRemitido.get('dateHistory')?.value,
      creatinineResultDate: this.infoConsulta.getRawValue().creatinineResultDate,
      creatinineResult: String(valorCreatinina),
    }

    this.trazabilidad(nuevoEvent, null, 1, 'Creación');

    //fin traza
  }

}
