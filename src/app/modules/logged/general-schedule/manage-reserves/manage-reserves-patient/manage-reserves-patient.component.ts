import { Component, ElementRef, HostListener, Renderer2, TemplateRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/autenticacion/auth..service';
import { HubService } from '@app/services/hubs/hub.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { EspecialidadesService } from '@app/services/parametrizacion/especialidades/especialidades.service';
import { AdmReservasService } from '@app/services/servicios-agendamiento/adm-reservas/adm-reservas.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import moment from 'moment';
import { Subject, takeUntil, lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-manage-reserves-patient',
  standalone: true,
  imports: [MatIconModule, ReactiveFormsModule, MatTooltipModule, BasicInputComponent],
  templateUrl: './manage-reserves-patient.component.html',
  styleUrl: './manage-reserves-patient.component.scss'
})
export class ManageReservesPatientComponent {
  formSearch = this.fb.group({
    idSede: ['', Validators.required],
    dateAppointment: [''],
    code: [''],
  })

  permisosDelModulo: any
  consultaActual: any
  listSedes: any[] = [];

  idpatient: number = 0;

  reservas: any[] = [];
  titles: any[] = ['Médico', 'Código de reserva', 'Duración de la cita', 'Tipo de atención', 'Paciente', 'Documento', 'Categoría', 'Especialidad', 'Característica', 'Elemento', 'Condición especial', 'Dirección']
  eliminacionForm = this.fb.group({
    motivo: ['', [Validators.required, Validators.minLength(5)]]
  })

  detalleBody: any[] = []

  detalleCabezeros: any[] = [
    'Categoría', 'Especialidad', 'Caracteristica', 'Elemento', 'Condición especial', 'Dirección'
  ]
  detalleIcons: any[] = [
    'reloj', 'tipoAtencion', 'categoria', 'especialidad', 'caracteristica', 'elemento', 'condicion-especial', 'sede'
  ]

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();

  constructor(private fb: FormBuilder, private dialog: MatDialog,
    private modalSvc: ModalService, private shadedSVC: SharedService, private authsvc: AuthService,
    private loaderSvc: LoaderService, private router: Router,
    private elRef: ElementRef, private renderer: Renderer2, private admReservasSvc: AdmReservasService,
    private especialidadsvc: EspecialidadesService,  private tzs: TrazabilidadService,
    private hubService: HubService,) {
    const tokenDecoded = this.authsvc.decodeToken();
    if (tokenDecoded && tokenDecoded.IdPatient[1] && tokenDecoded.IdPatient[1] != "0") {
      this.idpatient = tokenDecoded.IdPatient[1]
    };

    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Administración de reservas')

    this.hubService.on('Cita', (cita: any) => {
      if (this.fv.idSede) {
        let sede = cita.data.idAttentionCenter
        if (this.fv.idSede && this.fv.idSede == sede) {
          this.traerReservas();
        }
      }
    })
  }
  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  async ngOnInit(): Promise<void> {

    await this.getSedes()
  }

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  get fv() {
    return this.formSearch.value
  }
  get fc() {
    return this.formSearch.controls
  }


  private ajustarAlto() {


    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const title = this.elRef.nativeElement.querySelector('.title').offsetHeight;
    const formulario = this.elRef.nativeElement.querySelector('.form-search').offsetHeight;
    let he = container - title - formulario - 105;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.cont-reservas'), 'height', `${he}px`);
  }
  agendarCita() {
    this.router.navigate(['inicio/agenda-general/agendamiento'])
  }

  async traerReservas() {

    if (this.formSearch.invalid) {
      this.formSearch.markAllAsTouched();
      return
    }

    try {
      this.loaderSvc.show()
      this.ajustarAlto()
      this.loaderSvc.text.set({ text: 'Cargando reservas' })


      let filter: any = {
        idSede: this.fv.idSede,
        status: 1
      }
      if (this.fv.dateAppointment) filter.dateAppointment = this.fv.dateAppointment
      filter.documentPatient = ''
      filter.firstNamePatient = ''
      filter.secondNamePatient = ''
      filter.firstLastNamePatient = ''
      filter.secondLastNamePatient = ''
      filter.pageNumber = 1
      filter.pageSize = 100
      filter.idPatient = this.idpatient
      //filter.idPatient = 187645

      this.consultaActual = filter;

      let response = await lastValueFrom(this.admReservasSvc.consultReservations(filter))
      if (response.ok && response.data && response.data.RegistrosTotales > 100) {
        response = await lastValueFrom(this.admReservasSvc.consultReservations(filter))
      }
      this.loaderSvc.hide();
      if (response.ok && response.data) {

        this.reservas = []

        if (response.data.Citas.length && this.fv.code) {
          response.data.Citas = response.data.Citas.filter((e: any) => e.idAppointment == this.fv.code);
          if (response.data.Citas.length == 0) {
            this.modalSvc.openStatusMessage('Aceptar', 'No se encontraron reservas con los filtros ingresados', '3')
            return
          }
        }



        for (const r of response.data.Citas) {


          let objeto = [{
            titulo: 'Código de reserva',
            desc: r.internalCode,
          },
          {
            titulo: 'Duración de la cita',
            desc: this.calcularDuracion(r.startTime, r.endTime),
          },
          {
            titulo: 'Tipo de atención',
            desc: r.idTypeAttention.includes(1) && r.idTypeAttention.includes(2)
              ? 'Presencial, Virtual'
              : r.idTypeAttention.includes(1)
                ? 'Presencial'
                : r.idTypeAttention.includes(2)
                  ? 'Virtual'
                  : 'No encontrado'
          },
          {
            titulo: 'Paciente',
            desc: r.namePatient,
          },
          {
            titulo: 'Documento',
            desc: r.documentPatient,
          },
          {
            titulo: 'Estado de la transacción',
            desc: r.statusName ? r.statusName : 'Sin estado',
          },


          ]

          this.reservas.push({
            fecha: this.formatSpanishDate(r.dateAppointment),
            icono: r.iconName,
            hora: this.formatTimeToAmPm(r.startTime),
            itemCompleto: r,
            items: objeto
          })


        }

      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'No se encontraron reservas', '3')
        this.reservas = []

      }
    } catch (error) {
      console.error(error)
      this.reservas = []
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', 'Error al cargar las reservas', '4')
    }
  }


  formatDate(dateStr: string): string {
    return moment(dateStr).format('l');
  }

  formatSpanishDate(dateStr: string): string {
    return moment(dateStr).locale('es').format('dddd, DD [de] MMMM [de] YYYY');
  }
  formatTimeToAmPm(timeStr: string): string {
    // Dividir la cadena de tiempo en horas y minutos
    const [hours, minutes] = timeStr.split(':');
    let hoursNumber = parseInt(hours);

    // Determinar si es AM o PM
    const period = hoursNumber >= 12 ? 'PM' : 'AM';

    // Convertir la hora al formato de 12 horas
    hoursNumber = hoursNumber % 12 || 12; // Convierte 0 a 12 para la medianoche y ajusta el resto

    // Formatear la hora con minutos y periodo (AM/PM)
    return `${hoursNumber}:${minutes} ${period}`;
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


  async getSedes() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando sede' })
      let items = await this.shadedSVC.getSedes().toPromise();
      this.loaderSvc.hide()
      if (items.data) {
        let itemsArctive = items.data.filter((sede: any) => sede.active == true);
        this.listSedes = itemsArctive;
      }

    } catch (error) {
      this.loaderSvc.hide()
    }

  }

  reprogramar(item: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '3');
      return;
    }
    const idAppointment = item.idAppointment;
    const sedeAppointment = item.sedeAppointment;
    sessionStorage.setItem('sedeAppointment', sedeAppointment);
    const status = 1;
    this.router.navigate([`inicio/agenda-general/admin-reserva/reprogramar/${status}/${idAppointment}`]);

  }

  limpiar() {
    this.formSearch.reset();
    this.reservas = [];
  }
  modalPregunta(item: any, template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {

    if (!this.permisosDelModulo.Eliminar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para cancelar la reserva', '3');
      return
    }
    this.eliminacionForm.get('motivo')?.reset();
    const idAppointment = item.itemCompleto.idAppointment
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

        await this.eliminarReserva(idAppointment)
        dialogRef.close();
      } else {
        this.eliminacionForm.markAllAsTouched();
      }
    });
  }



  async eliminarReserva(idAppointment: any) {
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
        this.modalSvc.openStatusMessage('Aceptar', '¡Reserva cancelada correctamente en el sistema correctamente!', '1')

        this.formSearch.patchValue(this.consultaActual);
        await this.traerReservas();
      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'No fue posible cancelar la reserva', '3')
      }
    } catch (error) {
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', 'Error al cancelar la reserva', '4')
    }

  }

  async openModal(template: TemplateRef<any>, idReserva: any, titulo: string = '', mensaje: string = '') {

    let r = await this.generDetalle(idReserva)
    if (!r) return

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
            data.categoryName ? data.categoryName : '-',
            data.specialtiesName ? data.specialtiesName : '-',
            data.characteristicName ? data.characteristicName : '-',
            data.elementName ? data.elementName : '-',
            data.specialCondition ? data.specialCondition : '-',
            data.address ? data.address : '-',
          ];
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



}
