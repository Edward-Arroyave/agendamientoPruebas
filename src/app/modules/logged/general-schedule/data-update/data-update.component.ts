import { NgClass, CommonModule } from '@angular/common';
import { Component, ElementRef, Renderer2, TemplateRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../../shared/inputs/basic-input/basic-input.component';
import { PatientService } from '@app/services/pacientes/patient.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { ModalService } from '@app/services/modal/modal.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { UsersService } from '@app/services/usuarios/users.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { AuthService } from '@app/services/autenticacion/auth..service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { IPacienteHis } from '@app/shared/interfaces/usuarios/paciente-his.model';


@Component({
  selector: 'app-data-update',
  standalone: true,
  imports: [
    CommonModule,
    NgxPaginationModule,
    MatIcon,
    NgClass,
    ReactiveFormsModule,
    BasicInputComponent,
    RouterLink
  ],
  templateUrl: './data-update.component.html',
  styleUrl: './data-update.component.scss'
})
export class DataUpdateComponent {

  cabeceros: string[] = ['Tipo de documento','Numero de identificación','Nombre del paciente','Editar','Eliminar'];
  pacientes: any[] = [];
  PacientesFilter: any[] = [];
  formSearch = this.fb.group({
    searchTypeDocument: ['',[Validators.required]],
    searchIdentificationNumber: ['',[Validators.required, Validators.minLength(4)]],
    firstName: [''],
    secondName: [''],
    firstLastName: [''],
    secondLastName: ['']
  });
  documentsTypes: any[] = [];
  permisosDelModulo: any
  paginador = 1;
  pageSize = 20;
  totalItems = 0;
  pagedData: any[] = [];
  p: number = 1;

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  constructor(
    private authService: AuthService,
    private userSvc: UsersService,
    private patientSvc: PatientService,
    private modalService:ModalService,
    private shadedSVC: SharedService,
    private fb: FormBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private dialog : MatDialog,
    private loaderSvc: LoaderService,
    private tzs: TrazabilidadService,
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Actualización de datos')
    // Verificar si el usuario es un paciente
    const tokenDecoded = this.authService.decodeToken();
    if (tokenDecoded && tokenDecoded.IdPatient) {
      const idPatient = tokenDecoded.IdPatient[1];

      // si 1 esta vacio es un administrador
      if (idPatient && idPatient.trim() !== '' && idPatient !== '1' && idPatient !== '0') {
        // Si 1 tiene id de paciente, se va a la ruta
        this.router.navigate(['inicio/agenda-general/actualizar-datos/edit', idPatient]);
      }
    }
  }

  ngOnInit(): void {
    this.getDocuments();
  }

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  trazabilidad(antes:any,despues:any | null,idMovimiento:number,movimiento:string){
    const dataTrazabilidad:dataTrazabilidad= {
        datos_actuales: antes,
        datos_actualizados: despues,
        idModulo: 1,
        idMovimiento,
        modulo: "Administración",
        movimiento,
        subModulo: "Actualización de datos"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.tabs-container').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.content-tab'), 'height', `${he}px`);
    let paginador = he / 30;

    this.pageSize = Math.floor(paginador / 2);
    this.paginador = 1;
    this.handlePageChange(1);
  }


   handlePageChange(page: number) {
    this.paginador = page;
    if(this.totalItems/this.paginador <= 10 ) this.buscarCharacter();
  }

  async getDocuments() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando tipos de documento' })
      let documents = await lastValueFrom(this.shadedSVC.documentsTypes());
      if (documents.data) {
        this.documentsTypes = documents.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }

   // Método para cargar los datos de pacientes
   cargarPacientes(): void {

    const desde = this.totalItems;
    const hasta = this.pageSize;

    this.patientSvc.listarPacientes(desde.toString(), hasta.toString()).subscribe(
      (response: any) => {

        if (response.data) {
          const nuevosPacientes = response.data.map((paciente: IPacienteHis) => {
            const documentType = this.documentsTypes.find((doc: any) => doc.documentType === String(paciente.identificationNumber).split('-')[0] )?.documentType || 'Desconocido';
            return {
              item1: documentType,
              item2: paciente.identificationNumber,
              item3: `${paciente.patientName} ${paciente.patientLastNames}`,
              item4: paciente, // Editar
              item5: paciente  // Eliminar
            };
          });

          this.PacientesFilter.push(...nuevosPacientes);
          // paginador
          this.totalItems = response.totalItems || this.PacientesFilter.length;
        }else{
          this.modalService.openStatusMessage('Cancelar','No se encontraron mas pacientes','3');
        }
      },
      (error) => {
        console.error('Error al obtener la lista de pacientes:', error);
      }
    );
  }

  buscarCharacter(flagReinicio:boolean= false): void {
    this.loaderSvc.show();
    this.loaderSvc.text.set({ text: 'Cargando pacientes' })
    if(flagReinicio){
      this.totalItems = 0;
      this.paginador = 1;
      this.PacientesFilter = [];
    }
    const desde = this.totalItems;
    const hasta = this.pageSize;

    const filtrosAplicados = {
      idIdentificationType: this.formSearch.get('searchTypeDocument')?.value || 0,
      identificationNumber: this.formSearch.get('searchIdentificationNumber')?.value || null,
      firstName: this.formSearch.get('firstName')?.value || null,
      secondName: this.formSearch.get('secondName')?.value || null,
      firstLastName: this.formSearch.get('firstLastName')?.value || null,
      secondLastName: this.formSearch.get('secondLastName')?.value || null,

    };

    this.patientSvc.buscarPacientes(desde.toString(), hasta.toString(), filtrosAplicados).subscribe(
      (response: any) => {
        if (response.data) {
          const nuevosPacientes = response.data.map((paciente: any) => {
            const documentType = this.documentsTypes.find((doc: any) =>
              String(doc.documentType).includes(String(paciente.identificationNumber).split('-')[0])
            )?.documentType || 'Desconocido';
            return {
              item1: documentType,
              item2: paciente.identificationNumber,
              item3: `${paciente.patientName} ${paciente.patientLastNames}`,
              item4: paciente, // Editar
              item5: paciente  // Eliminar
            };
          });
          this.PacientesFilter.push(...nuevosPacientes);
          this.totalItems = response.totalItems || this.PacientesFilter.length;
        }else{
          this.modalService.openStatusMessage('Cancelar','No se encontraron mas pacientes','3');
        }
        this.loaderSvc.hide();
      },
      (error) => {
        console.error('Error al buscar pacientes:', error);
        this.loaderSvc.hide();
        this.paginador =1
        this.cargarPacientes();
      }
    );
  }


  limpiarFiltros(): void {
    this.loaderSvc.show();
    this.formSearch.reset();
    this.totalItems = 0;
    this.paginador =1 ;
    this.PacientesFilter = [];
    this.loaderSvc.hide();
  }


  get fc() { return this.formSearch.controls; }

  savePatient(event: any){
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
      this.cargarPacientes();
      return;
    }
      this.router.navigate(["inicio/agenda-general/actualizar-datos/edit/", event.idPatient]);
  }

  async eliminar(event: any): Promise<void> {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '4')
      return
    }
    const idUser = event.idUserAgendamiento;
    this.loaderSvc.show();

    try {
      const resp = await lastValueFrom(this.userSvc.deleteUser(idUser));
      if(resp.ok){
        this.trazabilidad(event,null,3,'Eliminación')
        this.modalService.openStatusMessage('Aceptar', 'Paciente eliminado correctamente', '1');
        this.cargarPacientes();
      }else{
        this.cargarPacientes();
      }
    } catch (error) {
        this.modalService.openStatusMessage('Aceptar', 'Ocurrió un error al eliminar el paciente, intente de nuevo', '4');
    } finally {
        this.loaderSvc.hide();
    }
  }

  busquedaAvanzadaModal(template: TemplateRef<any>): void {
    const destroy$ = new Subject<boolean>();

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
      this.buscarCharacter(true);
      dialogRef.close();
    });
  }





}
