import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { DatePipe, NgClass, NgSwitch, NgSwitchCase, NgTemplateOutlet, registerLocaleData } from '@angular/common';
import { Component, effect, HostListener, LOCALE_ID, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ModalService } from '@app/services/modal/modal.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { TarjetaPacienteComponent } from '@app/shared/tabla/tarjeta-paciente/tarjeta-paciente.component';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { LoaderService } from '@app/services/loader/loader.service';
import { User } from '@app/shared/interfaces/usuarios/users.model';
import moment from 'moment';
import { CompanionPatient, IAgenda, IProcemientoAgendarCita, IReservar, ListDisponibilityAppointment } from '@app/shared/interfaces/agendar-cita/agendar-cita.interface';
import { PreparationsService } from '../../../../services/parametrizacion/preparations/preparations.service';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { AdminEspaciosService } from '@app/services/servicios-agendamiento/admin-espacios/admin-espacios.service';
import { ConsultAdminEspacio } from '@app/shared/interfaces/agendamiento/admin-espacion.model';

import localEs from '@angular/common/locales/es'
import { AgendarCitaService } from '@app/services/servicios-agendamiento/agendar-cita/agendar-cita.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { Router } from '@angular/router';
import { FormatTimePipe } from '@app/pipes/format-time.pipe';
import { Step1Component } from './steps/step-1/step-1.component';
import { Step2Component } from './steps/step-2/step-2.component';
import { Step3Component } from './steps/step-3/step-3.component';
import { Step6Component } from './steps/step-6/step-6.component';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { ExamsLaboratoryService } from '../../../../services/exams-laboratory/exams-laboratory.service';
import { IPacienteHis } from '@app/shared/interfaces/usuarios/paciente-his.model';
import { AdmReservasService } from '@app/services/servicios-agendamiento/adm-reservas/adm-reservas.service';
import { IAdmReserva } from '@app/shared/interfaces/agendamiento/AdministracionReservas.interface';
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { MercadoPagoService } from '@app/services/mercado-pago/mercado-pago.service';
import { environment } from '@env/environment.development';
import { HubService } from '@app/services/hubs/hub.service';
import { ICostoExamen } from '@app/shared/interfaces/payment-gateway/payment-gateway.model';
import { MonitorService } from '@app/services/interoperability/monitor/monitor.service';
import { AuthService } from '@app/services/autenticacion/auth..service';
import { PaymentGatewayService } from '@app/services/payment-gateway/payment-gateway.service';
import { ElementsService } from '../../../../services/parametrizacion/elements/elements.service';
import { Elementos, ListElementContracts } from '@app/shared/interfaces/parametrizacion/elementos.model';
registerLocaleData(localEs, 'es');
declare var MercadoPago: any;

@Component({
  selector: 'app-schedule-an-appointment',
  standalone: true,
  imports: [
    FormatTimePipe,
    BasicInputComponent,
    MatIcon,
    MatTooltip,
    NgClass,
    NgSwitchCase,
    NgSwitch,
    NgTemplateOutlet,
    TarjetaPacienteComponent,
    MatRadioButton,
    MatRadioGroup,
    DatePipe,
    CdkScrollable,
    Step1Component,
    Step2Component,
    Step3Component,
    Step6Component
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es' }
  ],
  templateUrl: './schedule-an-appointment.component.html',
  styleUrl: './schedule-an-appointment.component.scss'
})
export class ScheduleAnAppointmentComponent implements OnInit {

  @ViewChild('requisitos') requisitosTemplate!: TemplateRef<any>;
  @ViewChild('reservas') reservasTemplate!: TemplateRef<any>;


  nombreUsuario: string = this.sharedSvc.obtenerNameUserAction();
  idUser: number = this.sharedSvc.obtenerIdUserAction();
  idPatient: number = 0;

  listaAgenda: IAgenda[] = [];
  listaAgendaSeleccionada: ListDisponibilityAppointment[] = [];
  listaRequerimientos: any[] = [];
  listaRequerimientosConfimacion: any[] = [];

  listaAtencion: any[] = [];
  listaDePreparaciones: any[] = [];
  listaDocumentos: any[] = [];

  listaDePendiente: number[] = [];
  listaSelectedIdExam = signal<number[]>([])
  flagPendiente: boolean = false;

  paciente!: IPacienteHis;
  procedimientoSelected!: IProcemientoAgendarCita;

  pacienteParticularFlag: boolean = false;
  verPacienteParticular: boolean = true;
  buscarPaso3Flag = signal<boolean>(false);

  redireccionPayment: string = "";
  contractCode: string = "";
  internalCode: string = "";
  entidad: string = "";
  observacionesText: string | null = null;
  currentTabId: number = 1;
  tipoSeleccion: number = 1;

  mindate = new Date()
  maxDate = new Date()

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

  formProcedimiento: FormGroup = this.fb.group({
    idCategory: [, [Validators.required]],
    idCountry: [, [Validators.required]],
    idDepartment: [, [Validators.required]],
    idCity: [, [Validators.required]],
    idAttentionCenter: [, []],
    listIdExamens: [this.fb.array([]), []],
    search: ["", []],
  });

  formParametros: FormGroup = this.fb.group({
    desiredDate: [, []],
    idTypeAttention: [, [Validators.required]],

    fechaCreatina: [, []],
    resultCreatina: [, []],

    idElement: [, []],
    idSpecialties: [, []],
    idCity: [, []],
  })



  tabs: any = [
    { id: 1, number: 1, name: 'Datos', completed: false },
    { id: 2, number: 2, name: 'Entidad', completed: false },
    { id: 3, number: 3, name: 'Procedimiento', completed: false },
    { id: 4, number: 4, name: 'Parámetros', completed: false },
    { id: 5, number: 5, name: 'Agenda', completed: false },
    { id: 6, number: 6, name: 'Confirmación', completed: false }
  ]

  private mp: any;

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

  formButtonCompanion = new FormControl(false);

  constructor(private fb: FormBuilder,
    private modalService: ModalService,
    private dialog: MatDialog,
    private loaderSvc: LoaderService,
    private preparationsService: PreparationsService,
    private adminEspaciosService: AdminEspaciosService,
    private agendarCitaService: AgendarCitaService,
    private router: Router,
    private sharedSvc: SharedService,
    private tzs: TrazabilidadService,
    private examService: ExamsLaboratoryService,
    private admReservasSvc: AdmReservasService,
    private mercadoPagoService: MercadoPagoService,
    private hubService: HubService,
    private monitorService: MonitorService,
    private authSvc: AuthService,
    private paymentGatewayService: PaymentGatewayService,
    private elementsService: ElementsService
  ) {
    this.hubService.on('Cita', (cita: any) => {
      if (this.listaAgenda && this.listaAgenda[0]) {
        if (this.listaAgenda[0].listDisponibilityAppointment.length) {
          let sede = cita.data.attentionCenterName
          let characteristic = cita.data.idCharacteristic
          const fechaCita = new Date(cita.data.desiredDate).toISOString().split('T')[0];
          this.listaAgenda[0].listDisponibilityAppointment = this.listaAgenda[0].listDisponibilityAppointment.filter((a: any) => {
            return (
              this.listaAgenda[0].idCharacteristic !== characteristic ||
              this.listaAgenda[0].sede !== sede ||
              new Date(a.desiredDate).toISOString().split('T')[0] !== fechaCita ||
              a.startTime !== cita.data.startTime ||
              a.endTime !== cita.data.endTime
            );
          });
        }
      }
    })
  }

  async ngOnInit() {

    await this.getDocuments()
    let tokenDecoded = this.authSvc.decodeToken();
    this.idPatient = parseInt(tokenDecoded.IdPatient[1]);
    this.contratoParticular()
  }

    async getDocuments() {
      try {
        this.loaderSvc.show()
        this.loaderSvc.text.set({ text: 'Cargando tipos de documento...' })
        let documents = await lastValueFrom(this.sharedSvc.documentsTypes());
        if (documents.data) {
          this.listaDocumentos = documents.data;
        }
        this.loaderSvc.hide();
      } catch (error) {
        this.loaderSvc.hide();
      }

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
      // this.loaderSvc.hide();
    } catch (error) {
      // this.loaderSvc.hide();
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

  async obtenerCostoExamen() {
    try {
      const costo = await lastValueFrom(this.mercadoPagoService.obtenerCostoExamen(this.internalCode, this.procedimientoSelected.cups!, this.contractCode));
      return JSON.parse(costo.data).data;
    } catch (error) {
      return [];
    }
  }

  async crearControl(idAppointment: number, preferencia: any, idStatus: number = 1) {
    this.idUser = this.sharedSvc.obtenerIdUserAction();
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
    let examen: ICostoExamen[] = [];
    this.loaderSvc.show();
    this.loaderSvc.text.set({ text: 'Cargando mercado pago...' })

    await loadMercadoPago();
    const lo: any = 'es-CO'
    // const mp = new MercadoPago(environment.mercadoPagoKey, { locale: lo });
    const documento = this.paciente.identificationNumber.split('-');

    try {
      // Obtener el costo del examen
      await this.obtenerCostoExamen().then(z => examen = z);
      if (examen == null) {
        this.dialog.closeAll();
        this.loaderSvc.hide();
        this.modalService.openStatusMessage("cancelar", 'No existe costo para el examen', '4');
        return;
      }

      // Crear la preferencia
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
      let result = await lastValueFrom(this.mercadoPagoService.crearPreferencia(preferencia))

      if (result.ok) {
        await this.crearControl(idAppointment, result);
        this.loaderSvc.hide();
        location.href = result.data.initPoint;
        // const preferenceId = result.data.id;
        // const bricksBuilder = mp.bricks();
        // const renderPaymentBrick = async (bricksBuilder: any) => {
        //   const settings = {
        //     initialization: {
        //       preferenceId: preferenceId,
        //     },
        //     customization: {
        //       theme:'dark',
        //       customStyle: {
        //           valueProp: 'practicality',
        //           valuePropColor: 'black',
        //           borderRadius: '10px',
        //           verticalPadding: '10px',
        //           horizontalPadding: '10px',
        //       }
        //     },
        //   };
        //   await bricksBuilder.create(
        //     "wallet",
        //     "mercado-pago-checkout",
        //     settings
        //   );
        // };
        // renderPaymentBrick(bricksBuilder);
      } else {
        await this.crearControl(idAppointment, result, 3);
        this.loaderSvc.hide();
        this.modalService.openStatusMessage('Cancelar', 'Ha ocurrido un error en la creación del pago, lo sentimos', '4');
      }
    } catch (error) {
      await this.crearControl(idAppointment, { ok: false, message: 'No existe costo para el examen' }, 3);
      this.dialog.closeAll();
      this.loaderSvc.hide();
      this.modalService.openStatusMessage("Cancelar", "No existe costo para el examen", "4");
    }
  }

  trazabilidad(antes: IReservar, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: null,
      idModulo: 1,
      idMovimiento,
      modulo: "Administración",
      movimiento,
      subModulo: "Agendamiento"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }



  get fullName() {
    return this.paciente.patientName + ' ' + this.paciente.patientLastNames;
  }

  scrollTop() {
    let div = document.getElementById('scrolllTop');
    if (div) div.scrollTop = 0;
  }

  validatorRequired(form: FormGroup, campo: string) {
    form.get(campo)?.setValidators([Validators.required]);
    form.get(campo)?.updateValueAndValidity();
  }

  validatorRemoved(form: FormGroup, campo: string) {
    form.get(campo)?.removeValidators([Validators.required]);
    form.get(campo)?.updateValueAndValidity();
    form.get(campo)?.reset();
  }

  async getRequisitosLaboratorio(examList: string) {
    try {
      await lastValueFrom(this.examService.getExamRequeriments(examList)).then(x => {
        this.listaRequerimientosConfimacion.push(...x.data);
        this.listaRequerimientosConfimacion = this.listaRequerimientosConfimacion.map(x => {
          if (this.listaSelectedIdExam().includes(x.idExam)) {
            return x
          }
          return false
        }).filter(y => y);
        this.listaRequerimientos = JSON.parse(JSON.stringify(this.listaRequerimientosConfimacion));
        this.modalRequisitos(this.requisitosTemplate);
        this.loaderSvc.hide();
      })
    } catch (error) {
      console.error(error)
    }
  }

  async getRequisitos(idElement: number | null, idCharacteristic: number | null, flagArr: boolean = false) {
    if (this.formParametros.invalid) {
      return this.modalService.openStatusMessage('Cancelar', 'Por favor complete los campos', '4');
    }

    if (idElement === null && idCharacteristic === null) return this.modalService.openStatusMessage('Cancelar', 'sin filtros', '4');
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando requisitos' });
      this.procedimientoSelected.requireElements ? '' : idElement = null;
      if (this.procedimientoSelected.associatedExam) {
        let arrIdListExam: any[] = this.formProcedimiento.get('listIdExamens')?.value;
        this.getRequisitosLaboratorio(arrIdListExam.join(','));
        return
      }

      const data = {
        idCharacteristic,
        idElement
      }
      const resp = await lastValueFrom(this.preparationsService.getDetail(data))
      if (resp.ok) {
        this.listaRequerimientos = resp.data.procedureRequirements;

        if (flagArr) {
          this.listaRequerimientosConfimacion.push(resp.data);
          this.loaderSvc.hide();
        }
      } else {
        if (flagArr) {
          this.listaRequerimientosConfimacion = [];
          this.loaderSvc.hide();
          return
        }
        this.loaderSvc.hide();
        this.modalService.openStatusMessage('Cancelar', 'No se encontro la preparación', '4');
        return
      }
      if (this.listaRequerimientos !== null && this.listaRequerimientos.length > 0 && !flagArr) {
        this.modalRequisitos(this.requisitosTemplate);
      } else {
        if (this.procedimientoSelected.specialConditionName == "Contrastado") {
          const result = this.calcularCreatinina();
          this.loaderSvc.hide();
          if (result === 0) return
        }
        this.getAgenda();
        this.tabs[this.currentTabId - 1].completed = true;
        if (this.currentTabId < 6) this.currentTabId += 1;
      }
      this.loaderSvc.hide();
      return this.listaRequerimientosConfimacion;
    } catch (error) {
      this.loaderSvc.hide();
      this.listaRequerimientos = [];
      this.listaRequerimientosConfimacion = [];
    }
  }

  async getAgenda() {
    if (this.formParametros.invalid) {
      return this.modalService.openStatusMessage('Cancelar', 'Por favor complete los campos', '4');
    }
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando requisitos' })

      const idOrigin = this.formRemitido.get('idOriginEntity')?.value;
      const data: ConsultAdminEspacio = {
        idCountry: this.formProcedimiento.get('idCountry')?.value,
        idCity: this.formProcedimiento.get('idCity')?.value,
        idTypeAttention: this.formParametros.get('idTypeAttention')?.value,
        desiredDate: this.formParametros.get('desiredDate')?.value,
        idElement: this.procedimientoSelected.requireElements || this.procedimientoSelected.associatedExam ? this.formParametros.get('idElement')?.value : null,
        idSpecialties: this.formParametros.get('idSpecialties')?.value,
        idOriginEntity: idOrigin ? idOrigin : 0,
        haveExams: this.procedimientoSelected.associatedExam!
      }

      const resp = await lastValueFrom(this.adminEspaciosService.getAvailableAgenda(data))
      if (resp.ok) {

        if (resp.data === null) {
          this.tabs[this.currentTabId - 1].completed = false;
          if (this.currentTabId < 6) this.currentTabId -= 1;
          this.loaderSvc.hide();
          return this.modalService.openStatusMessage('Cancelar', resp.message, '4');
        }

        this.listaAgenda = JSON.parse(JSON.stringify(resp.data));

        const sede = this.formProcedimiento.value.idAttentionCenter;
        if (sede) {
          this.listaAgenda = this.listaAgenda.filter(x => x.idSede === sede);
        } else {
          this.listaAgenda = this.listaAgenda.filter(x => x.idSede === this.procedimientoSelected.idAttentionCenter);
        }

        if (this.listaAgenda.length === 0) {
          this.loaderSvc.hide();
          this.tabs[this.currentTabId - 1].completed = false;
          if (this.currentTabId < 6) this.currentTabId -= 1;
          return this.modalService.openStatusMessage('Cancelar', 'La sede que seleccionó no tiene agenda', '4');
        }

        this.listaAgenda.map(x => {
          x.listDisponibilityAppointment = x.listDisponibilityAppointment
            .filter(j => this.sharedSvc.EsRangoValido(j.desiredDate, j.startTime))
            .map(y => {
              y.checked = false;
              return y;
            })
        })
        this.loaderSvc.hide();
        return
      }
      this.listaAgenda = [];
      this.modalService.openStatusMessage('Cancelar', resp.message, '4');
      this.loaderSvc.hide();
    } catch (error) {
      this.modalService.openStatusMessage('Cancelar', 'Ha ocurrido un error insperado', '4');
      this.loaderSvc.hide();
      this.listaAgenda = [];
    }
  }

  agregarRemoverDisponibilidad(checked: boolean, disponibilidad: ListDisponibilityAppointment,
    item_dispodibilidad: IAgenda,
    index_caracteristica: number,
    index_agenda: number) {
    // Se agrega la caracteristica para luego obtener el detalle de estas en el paso 6
    this.loaderSvc.show();
    this.loaderSvc.text.set({ text: 'Cargando disponibilidad' });
    disponibilidad.checked = checked;
    const nuevaData = {
      ...disponibilidad,
      caracteristicaName: item_dispodibilidad.characteristicName,
      idcaracteristica: item_dispodibilidad.idCharacteristic,
      sede: item_dispodibilidad.sede,
      duracion: item_dispodibilidad.particularTime,
      idAgenda: item_dispodibilidad.idAgenda,
      cups: item_dispodibilidad.cups ? item_dispodibilidad.cups : ''
    };
    if (checked) {
      this.listaAgendaSeleccionada = [{ ...nuevaData }];
      this.loaderSvc.hide();
      this.modalReservar(this.reservasTemplate);
      return
    }

    this.listaAgendaSeleccionada = this.listaAgendaSeleccionada.filter(x => x.startTime !== disponibilidad.startTime || disponibilidad.desiredDate !== x.desiredDate);
    this.loaderSvc.hide();
  }

  formula(variableValue: number, divisor: number, dividendo: number, exponente: number, base: number, edad: number): number {
    return variableValue * Math.pow(divisor / dividendo, exponente) * Math.pow(base, edad);
  }

  procedimientoCreatinina(keyOperador: string, resultado: number, keyValue1: string, keyValue2?: string): number {
    const procedimiento: any = this.procedimientoSelected;
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
    let divisor: number = Number(this.formParametros.get('resultCreatina')?.value);

    const nacimiento = moment(this.paciente.birthDate, 'DD-MM-YYYY');
    const hoy = moment();
    const edad = hoy.diff(nacimiento, 'years');
    if (sexo === 'Mujer') {
      variableValue = 144;
      dividendo = 0.7;
      if (divisor <= dividendo) resultado = this.formula(variableValue, divisor, dividendo, -0.329, base, edad);
      if (divisor > dividendo) resultado = this.formula(variableValue, divisor, dividendo, -1.209, base, edad);
    } else if (sexo === 'Hombre') {
      variableValue = 141;
      dividendo = 0.9;
      if (divisor <= dividendo) resultado = this.formula(variableValue, divisor, dividendo, -0.411, base, edad);
      if (divisor > dividendo) resultado = this.formula(variableValue, divisor, dividendo, -1.209, base, edad);
    }
    const arrKeys: any[] = ['idOperatorMin', 'idOperatorMax', 'idOperatorInter'];
    const arrValues: any[] = ['valuesMin', 'valuesMax', 'valuesInter'];

    console.log('Creatinina : ',resultado);

    for (let index = 0; index < [1, 2, 3].length; index++) {
      if (index !== 2) resultado = this.procedimientoCreatinina(arrKeys[index], resultado, arrValues[index]);
      if (index === 2) resultado = this.procedimientoCreatinina(arrKeys[index], resultado, arrValues[index] + '1', arrValues[index] + '2');
      if (resultado === 0) break;
    }

    if (this.procedimientoSelected?.idOperatorInter) {
      if (resultado > this.procedimientoSelected.valuesInter1! && resultado < this.procedimientoSelected.valuesInter2!) {
        this.observacionesText = this.procedimientoSelected.observations!;
      }
    }
    return resultado;
  }

  async confirmarCita(item: any) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Confirmando reserva' })

      let reserva = {
        idAppointment: item.idAppointment,
        confirmReservation: true,
        confirmPatientAttendance: false
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

  redireccion(cita: IReservar, porSede: boolean = false) {
    if (this.sharedSvc.obtenerPermisosModulo('Administración de citas').Ver && !porSede) {
      this.router.navigate(['/inicio/agenda-general/admin-citas'], { state: { data: cita } });
    } else {
      if (this.sharedSvc.obtenerPermisosModulo('Administración de reservas').Ver) {
        this.router.navigate(['/inicio/agenda-general/admin-reserva'], { state: { data: cita } });
      } else {
        this.modalService.openStatusMessage('Cancelar', 'Reserva creada ', '1');
        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    }
  }

  async crearReserva(mercadoPago?: boolean) {
    let entidad = this.formRemitido.value.idOriginEntity === null ? null : this.formRemitido.value;
    let nuevaObjEntidad = entidad;
    let clinicHistory = this.formRemitido.value.clinicHistory;
    let dateHistory = this.formRemitido.value.dateHistory;
    let medicalOrder = this.formRemitido.value.medicalOrder;
    let dateOrder = this.formRemitido.value.dateOrder;
    let medicalAuthorization = this.formRemitido.value.medicalAuthorization;
    let dateAuthorization = this.formRemitido.value.dateAuthorization;

    !mercadoPago ? mercadoPago = false : '';

    const base = "data:application/pdf;base64,";
    if (entidad !== null) {
      nuevaObjEntidad = {
        IdOriginEntity: this.formRemitido.value.idOriginEntity,
        clinicHistory: clinicHistory !== null ? base + clinicHistory : null,
        dateHistory: dateHistory !== null ? dateHistory : null,
        medicalAuthorization: medicalAuthorization !== null ? base + medicalAuthorization : null,
        dateAuthorization: dateAuthorization !== null ? dateAuthorization : null,
        dateOrder: dateOrder !== null ? dateOrder : null,
        medicalOrder: medicalOrder !== null ? base + medicalOrder : null
      }
    }

    let valorCreatinina: string | null = null;
    if (this.procedimientoSelected.specialConditionName == "Contrastado") {
      valorCreatinina = String(this.calcularCreatinina());
    }
    !this.pacienteParticularFlag ? this.contractCode = this.formRemitido.get('plan')?.value : "";
    this.procedimientoSelected.idElement ? await this.obtenerElemento(this.procedimientoSelected.idElement!) : "";
    const cita: IReservar =
    {
      idPatient: Number(this.paciente.idPatient),
      idPatientType: this.pacienteParticularFlag ? Number(1) : Number(2),
      idSpecialties: this.procedimientoSelected.idSpecialties!,
      creatinineResultDate: this.formParametros.value.fechaCreatina,
      creatinineResult: valorCreatinina,
      meetsRequirements: true,
      originEntity: nuevaObjEntidad,
      statusPayment: 'pending',
      contract: this.contractCode,
      attentionCenterHomologate: 'TR_HORISOESII',
      idInstService: this.internalCode,
      paymentSede: mercadoPago!,
      selectedSchedulingTimes: this.listaAgendaSeleccionada.map(x => {
        const nuevoElemento = {
          idAgenda: x.idAgenda!,
          listIdExam: this.listaSelectedIdExam()?.length ? this.listaSelectedIdExam().join(',') : undefined,
          idElement: this.procedimientoSelected.idElement,
          idTypeAttention: this.formParametros.get('idTypeAttention')?.value,
          desiredDate: x.desiredDate,
          startTime: x.startTime,
          endTime: x.endTime,
          idSede: this.procedimientoSelected.idAttentionCenter,
          cups: x.cups,
          idCharacteristic: x.idcaracteristica,
          characteristicName: x.caracteristicaName
        };
        return nuevoElemento;
      })
    };
    if (this.formCompanion.valid && this.formButtonCompanion.value) {
      cita.companionPatient = {
        name: this.formCompanion?.get('name')?.value.trim(),
        idIdentificationType: this.formCompanion?.get('idIdentificationType')?.value,
        identificationNumber: this.formCompanion?.get('identificationNumber')?.value,
        adress: this.formCompanion?.get('adress')?.value.trim(),
        telephone: Number(this.formCompanion?.get('telephone')?.value),
        email: this.formCompanion?.get('email')?.value.trim(),
        idRelationShip: this.formCompanion?.get('idRelationShip')?.value
      }
    }
    this.loaderSvc.show();
    try {
      const resp = await lastValueFrom(this.agendarCitaService.crearReserva(cita));
      if (resp.ok) {
        const dataConfirmar: IAdmReserva = {
          idAppointment: resp.data.data.idAppointment,
          confirmReservation: true,
          confirmPatientAttendance: false
        }

        if (this.listaDePendiente.length) {
          this.listaAgendaSeleccionada = [];
          this.flagPendiente = true;
          this.currentTabId = 3;
          for (let index = 3; index < 6; index++) {
            this.tabs[index - 1].completed = false;
          };
          this.dialog.closeAll();
          if (this.procedimientoSelected.associatedExam) await this.confirmarCita(dataConfirmar);
          return
        }


        this.flagPendiente = false;
        this.formCompanion.reset();
        this.formButtonCompanion.setValue(false)
        this.trazabilidad(cita, 1, 'Creación');
        //Creación de cita para trazabilidad en historico

        let elemento = ''
        if (this.procedimientoSelected?.internalCode) {
          elemento = this.procedimientoSelected.internalCode + " " + this.procedimientoSelected.elementName;
        } else {
          if (this.procedimientoSelected.elementName) {
            elemento = this.procedimientoSelected.elementName;
          }
        }

        //Buscar el tipo de documento:
        let documentPatient = this.form.get('identificationNumber')?.value
        let document = this.listaDocumentos.find(x => x.idDocumentType == this.form.get('idIdentificationType')?.value);
        if (document) {
          let texto = document.documentType;
          const tipoDocumento = texto.split('-')[0].trim().toUpperCase(); // "cc"
          documentPatient = tipoDocumento + '-' + documentPatient;
        }

        this.tzs.crearTrazabilidadCitaHistorico(documentPatient,
          cita.selectedSchedulingTimes[0].idSede || 0, this.nombreUsuario, 1,
          cita.selectedSchedulingTimes[0].desiredDate, cita.selectedSchedulingTimes[0].startTime, elemento, resp.data.data.idAppointment);


        if (this.procedimientoSelected.associatedExam) {
          await this.confirmarCita(dataConfirmar);

          if (this.pacienteParticularFlag) {
            // PARTICULARc
            this.redireccion(cita);
            return
          } else {
            // REMITIDO
            this.redireccion(cita);
            this.loaderSvc.hide();
            return
          }
        } else {
          if (this.pacienteParticularFlag) {
            // PARTICULAR
            if (this.procedimientoSelected.idElement) {
              if (!mercadoPago) {
                await this.inicializarMercadoPago(resp.data.data.idAppointment);
              } else {
                this.loaderSvc.hide();
                await this.confirmarCita(dataConfirmar);
                this.dialog.closeAll();
                this.redireccion(cita, true);
              }
              return
            }
            if (this.sharedSvc.obtenerPermisosModulo('Administración de reservas').Ver) {
              this.router.navigate(['/inicio/agenda-general/admin-reserva'], { state: { data: cita } });
            } else {
              this.modalService.openStatusMessage('Cancelar', 'Reserva creada ', '1');
              setTimeout(() => {
                location.reload();
              }, 1000);
            }
          } else {
            // REMITIDO
            await this.confirmarCita(dataConfirmar);
            this.redireccion(cita);
          }
        }


        this.loaderSvc.hide();
        return
      } else {
        this.modalService.openStatusMessage('Cancelar', resp.message, '4');
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.modalService.openStatusMessage('Cancelar', 'La agenda no puede ser reservada, debido a que no se cumplen los requisitos de la cita. Por favor comuníquese al correo soporte@ithealth.co o a la linea (601)2372691 para confirmar la información o validar la agenda.', '4');
      this.loaderSvc.hide();
    }
  }

  async siguiente(value?: any | null) {
    switch (this.currentTabId) {
      case 1:
        if (this.form.invalid) {
          return this.modalService.openStatusMessage('Cancelar', 'Por favor complete los campos', '4')
        }
        this.tabs[this.currentTabId - 1].completed = true;
        if (this.currentTabId < 6) this.currentTabId += 1
        break;
      case 3:
        if (value === null) return;
        this.procedimientoSelected = value;
        if (!this.procedimientoSelected.associatedExam) {
          this.formParametros.get('idElement')?.setValue(this.procedimientoSelected.idElement);
        }

        this.formParametros.get('idSpecialties')?.setValue(this.procedimientoSelected.idSpecialties);

        const arr: any[] = [
          { idTypeAttention: 1, value: 'Presencial' },
          { idTypeAttention: 2, value: 'Virtual' }
        ];
        const arrTipoAtencion: string[] = this.procedimientoSelected.idTypeAttention?.split(',')!;
        this.listaAtencion = arrTipoAtencion?.map((x, i) => {
          return arr.filter(j => j.idTypeAttention === Number(x)).length > 0 ? arr[Number(x) - 1] : 0
        })!;

        if (this.listaAtencion.length === 1) {
          setTimeout(() => {
            this.formParametros.get('idTypeAttention')?.setValue(arrTipoAtencion[0]);
          }, 200);
        }

        if (this.procedimientoSelected.specialConditionName == "Contrastado") {
          this.validatorRequired(this.formParametros, 'fechaCreatina');
          this.validatorRequired(this.formParametros, 'resultCreatina');
        } else {
          this.validatorRemoved(this.formParametros, 'fechaCreatina');
          this.validatorRemoved(this.formParametros, 'resultCreatina');
        }

        this.tabs[this.currentTabId - 1].completed = true;
        if (this.currentTabId < 6) this.currentTabId += 1;
        setTimeout(() => {
          this.scrollTop()
        }, 200);
        break;
      case 4:
        if (this.formParametros.invalid) {
          this.modalService.openStatusMessage('Cancelar', 'Verifique todos los campos', '4')
          return
        }
        this.listaRequerimientosConfimacion = [];
        await this.getRequisitos(this.procedimientoSelected.idElement!, this.procedimientoSelected.idCharacteristic!);
        break;
      default:
        break;
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

  anterior() {
    this.loaderSvc.show();
    if (this.currentTabId === 1) this.verPacienteParticular = true;
    if (this.currentTabId === 2) this.pacienteParticularFlag = false;

    if (this.currentTabId === 3) {
      this.listaAgendaSeleccionada = [];
      this.formParametros.reset();
      // this.formParametros.get('idCity')?.setValue(this.paciente.idCity);
      this.formProcedimiento.reset({ search: "" });
      this.flagPendiente = false;
      this.formCompanion.reset();
      this.formButtonCompanion.setValue(false);
    }

    if (this.currentTabId === 4 || this.currentTabId === 5 || this.currentTabId === 6) this.listaAgendaSeleccionada = [];

    if (this.buscarPaso3Flag() && this.currentTabId === 3) {
      this.buscarPaso3Flag.set(false);
    } else {
      if (this.currentTabId > 1) this.currentTabId -= 1;
      if (this.currentTabId !== 1) this.tabs[this.currentTabId - 1].completed = false;
    }
    this.loaderSvc.hide();
  }

  modalRequisitos(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {

    let flagSinListaRequisitos = true;

    if (this.procedimientoSelected.associatedExam && flagSinListaRequisitos) {
      this.listaRequerimientos.forEach((lista: any) => {
        if (lista.listRequirements) flagSinListaRequisitos = false;
      });
      if (this.procedimientoSelected.associatedExam && flagSinListaRequisitos) {
        this.getAgenda();
        this.tabs[this.currentTabId - 1].completed = true;
        if (this.currentTabId < 6) this.currentTabId += 1;
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

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {


      const mensajeAdvertencia = "La agenda no puede ser reservada, debido a que no se cumplen los requisitos de la cita. Por favor comuníquese al correo soporte@ithealth.co o a la linea (601)2372691 para confirmar la información o validar la agenda.";
      let flagRequisitos: boolean = true;
      if (!this.procedimientoSelected.associatedExam) {
        this.listaRequerimientos.forEach(element => {
          if (element.essentialRequirement && !element.checked) {
            flagRequisitos = false;
            return;
          }
        });

        if (!flagRequisitos) return this.modalService.openStatusMessage('Cancelar', mensajeAdvertencia, '3', undefined, '50em');

        if (this.procedimientoSelected.specialConditionName == "Contrastado") {
          const result = this.calcularCreatinina();
          if (result === 0) return this.modalService.openStatusMessage('Cancelar', mensajeAdvertencia, '3', undefined, '50em');
        }
      } else {
        this.listaRequerimientos.forEach((lista) => {
          if (lista.listRequirements) {
            lista.listRequirements.map((element: any) => {
              if (element.essentialRequirement && !element.checked) {
                flagRequisitos = false;
                return;
              }
            })
          }
        });
      }

      if (!flagRequisitos) return this.modalService.openStatusMessage('Cancelar', mensajeAdvertencia, '3', undefined, '50em');
      this.getAgenda();
      this.tabs[this.currentTabId - 1].completed = true;
      if (this.currentTabId < 6) this.currentTabId += 1;

      setTimeout(() => {
        this.scrollTop()
      }, 200);
      dialogRef.close();
    });
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

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async x => {
      if (!this.procedimientoSelected.associatedExam) {
        this.listaRequerimientosConfimacion = [];
        for (const key in this.listaAgendaSeleccionada) {
          const idElement = this.procedimientoSelected.idElement;
          await this.getRequisitos(idElement ? idElement : null, this.listaAgendaSeleccionada[key].idcaracteristica!, true)
        }
      } else {
        this.tabs[this.currentTabId - 1].completed = true;
        if (this.currentTabId < 6) this.currentTabId += 1;
      }
      setTimeout(() => {
        this.scrollTop()
      }, 200);
      dialogRef.close();
    });
    dialogRef.componentInstance.secondaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      this.listaAgendaSeleccionada = [];
      dialogRef.close();
    })
  }

  modalAgendar(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {
    if (this.listaDePreparaciones.find(x => x.checked === false)) {
      if (this.listaDePreparaciones.filter(x => x.listRequirements === null).length !== this.listaDePreparaciones.length) {
        return this.modalService.openStatusMessage('Cancelar', 'Por favor confirmar la/s preparación/es para la cita, en el recuadro "He leído la preparación"', '3', undefined, '500px');
      }
    }
    if (!this.listaDePendiente.length) {
      const destroy$: Subject<boolean> = new Subject<boolean>();
      const data: ModalData = {
        content: template,
        btn: !this.pacienteParticularFlag ? 'Confirmar' : undefined,
        btn2: 'Cancelar',
        footer: true,
        title: titulo,
        message: mensaje,
        image: '',
        type: '1'
      };
      const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '48em', data, disableClose: true });

      if (this.pacienteParticularFlag) {
        //this.crearReserva();
        return
      }

      dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
        this.crearReserva();
        dialogRef.close();
      });

      dialogRef.componentInstance.secondaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
        //location.reload();
        dialogRef.close();
      });
    } else {
      this.crearReserva();
    }
  }
}
