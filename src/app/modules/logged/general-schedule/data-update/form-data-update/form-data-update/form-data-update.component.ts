import { CommonModule, JsonPipe, registerLocaleData } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@app/services/autenticacion/auth..service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { PatientService } from '@app/services/pacientes/patient.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { IPacienteHis } from '@app/shared/interfaces/usuarios/paciente-his.model';
import moment from 'moment';
import { lastValueFrom } from 'rxjs';

import localEs from '@angular/common/locales/es'
import { Patient } from '@app/shared/interfaces/pacientes/patient.model';

moment.locale('es');
registerLocaleData(localEs, 'es');


@Component({
  selector: 'app-form-data-update',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    BasicInputComponent
  ],
  templateUrl: './form-data-update.component.html',
  styleUrl: './form-data-update.component.scss'
})
export class FormDataUpdateComponent implements OnInit, OnDestroy {

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  idPatient: number = 0;
  paises: any[] = [];
  departamentos: any[] = [];
  cuidades: any[] = [];
  sedes: any[] = [];
  caracteristica: any[] = [];
  CondicionEspecial: any[] = [];
  documentsTypes: any[] = [];
  biologicalSexList: any[] = [];
  idElement: string | null = null;

  formRegister = this.fb.group({
    idIdentificationType: ['', [Validators.required]],
    identificationNumber: ['', [Validators.required]],
    name: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    secondname: ['',],
    secondLastName: [''],
    idDepartment: ['', [Validators.required]],
    idCountry: ['', [Validators.required]],
    idCity: ['', [Validators.required]],
    idBiologicalSex: ['', [Validators.required]],
    birthDate: ['', [Validators.required]],
    address: ['', [Validators.required]],
    email: ['', [Validators.required, this.emailValidator()]],
    confirmEmail: ['', [Validators.required]],
    telephone: ['', [Validators.required]],
    telephone2: [''],
  }, { validators: this.validarQueSeanIguales() });

  isPatient: boolean = false;
  patient: any;

  constructor(
    private authService: AuthService,
    private patientSvc: PatientService,
    private actRoute: ActivatedRoute,
    private fb: FormBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private shadedSVC: SharedService,
    private loaderSvc: LoaderService,
    private modalService: ModalService,
    private tzs: TrazabilidadService,
  ) {
    let patient = this.actRoute.snapshot.params['idPatient'];
    if (patient) {
      this.idPatient = Number(patient);
    }
  }

  async ngOnInit() {

    await this.getCountries();
    await this.getDocuments();
    await this.getBiologicalSex()

    const tokenDecoded = this.authService.decodeToken();
    if (tokenDecoded && tokenDecoded.IdPatient) {
      const idPatientFromToken = tokenDecoded.IdPatient[1];
      this.isPatient = !!idPatientFromToken && idPatientFromToken.trim() !== '';
    }
    this.filtrosPaises()
    if (this.idPatient) {
      this.loadPaciente(this.idPatient);
    }
  }

  ngOnDestroy(): void {
    this.idPatient = 0;
    this.isPatient = false;
  }

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  trazabilidad(antes: any, despues: any | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
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

  filtrosPaises() {
    this.fc.idCountry.valueChanges.subscribe(async p => {
      if (p) {
        await this.getDepartaments(Number(p))
      }
    })
    this.fc.idDepartment.valueChanges.subscribe(async p => {
      if (p) {
        await this.getCities(Number(p))
      }
    })
  }

  async loadPaciente(idPatient: any): Promise<void> {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando Paciente' });

      const response = await lastValueFrom(this.patientSvc.obtenerPacientePorId(idPatient));
      if (response.data) {
        const patient: IPacienteHis = response.data;
        if (patient) {
          this.patient = patient;
          const name = patient.patientName || '';
          const lastName = patient.patientLastNames || '';
          const nameParts = name.split(' ');
          const lastNameParts = lastName.split(' ');

          const filterIdentificationType = String(patient.identificationNumber).split('-')[0];
          const idIdentificationType = this.documentsTypes.find(x => String(x.documentType).includes(filterIdentificationType)).idDocumentType;
          const idCountry = this.paises.find(x => String(x.country).includes(patient.country)).idCountry;

          this.fc.idIdentificationType.setValue(idIdentificationType);
          this.fc.name.setValue(nameParts[0] || '');
          this.fc.secondname.setValue(nameParts[1] || '');
          this.fc.lastName.setValue(lastNameParts[0] || '');
          this.fc.secondLastName.setValue(lastNameParts[1] || '');
          this.fc.identificationNumber.setValue(String(patient.identificationNumber).split('-')[1]);
          this.fc.idCountry.setValue(idCountry || 48);
          this.fc.email.setValue(patient.email);
          this.fc.confirmEmail.setValue(patient.email);
          this.fc.telephone.setValue(patient.telephone);
          this.fc.telephone2.setValue(patient.telephone2);
          this.fc.address.setValue(patient.address);
          const fecha = moment(patient.birthDate, "DD/MM/YYYY").format();
          this.fc.birthDate.setValue(fecha);


          this.patient.userName = String(patient.identificationNumber).split('-')[1] + '_pa';
          this.patient.idUser = patient.idUserAgendamiento || 0;
        } else {
          console.error('Elemento no encontrado.');
        }
      }

      this.loaderSvc.hide();
    } catch (error) {
      console.error('Error al cargar los datos del paciente:', error);
      this.loaderSvc.hide();
    }
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

  async getBiologicalSex() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando tipos de género' })
      let biological = await lastValueFrom(this.shadedSVC.biologicalSex())
      if (biological.data) {
        this.biologicalSexList = biological.data;

        if (this.idPatient) {
          const idBiologicalSex = this.biologicalSexList.find(x => String(x.name).includes(this.patient.biologicalSex)).id;
          this.fc.idBiologicalSex.setValue(idBiologicalSex || 0);
        }
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }

  async getCountries() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando paises' })
      let items = await lastValueFrom(this.shadedSVC.getCountries())
      if (items.data) {
        this.loadPaciente(this.idPatient)
        this.paises = items.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }

  async getDepartaments(pais: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando departamentos' })
      this.fc.idDepartment.setValue('')
      let items = await lastValueFrom(this.shadedSVC.getDepartaments(pais));
      if (items.data) {

        this.departamentos = items.data;
        setTimeout(() => {
          if (this.patient.idDepartment) {
            this.fc.idDepartment.setValue(this.patient.idDepartment)
            // this.element.idDepartment = null;
          }

        }, 100);
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }

  async getCities(idDepartment: any) {
    try {
      this.loaderSvc.show()
      this.fc.idCity.reset()
      this.loaderSvc.text.set({ text: 'Cargando cuidades...' })
      let items = await lastValueFrom(this.shadedSVC.getCities(idDepartment));
      if (items.data) {
        this.cuidades = items.data;
        setTimeout(() => {
          if (this.idPatient) {
            const ciudad = this.cuidades.find(x => String(x.city).split('-')[1].trim().includes(this.patient.city));
            this.fc.idCity.setValue(String(ciudad.idCity || 149));
          }
        }, 100);
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }


  async save(): Promise<void> {
    if (this.formRegister.invalid) {
      this.formRegister.markAllAsTouched();
      return;
    }

    let patientData: Patient = {
      idPatient: this.idPatient,
      idNationality: Number(this.formRegister.value.idCountry) || 0,
      idCity: Number(this.fv.idCity),
      idCountry: Number(this.fv.idCountry),
      idDepartment: Number(this.fv.idDepartment),
      idIdentificationType: Number(this.fv.idIdentificationType),
      identificationNumber: String(this.fv.identificationNumber),
      firstName: String(this.fv.name),
      secondName: this.fv.secondname ? String(this.fv.secondname) : "",
      firstLastName: String(this.fv.lastName),
      secondLastName: this.fv.secondLastName ? String(this.fv.secondLastName) : "",
      birthDate: this.fv.birthDate ? new Date(this.fv.birthDate) :'',
      idBiologicalSex: Number(this.fv.idBiologicalSex),
      address: String(this.fv.address),
      telephone: String(this.fv.telephone),
      telephone2: this.fv.telephone2 ? String(this.fv.telephone2) : "",
      email: String(this.fv.email),
      idUserAction: 0,
      active: true,
      fullNameUserAction: this.nombreUsuario,
    }
    if (this.idPatient) {
      patientData.accountExpires = this.patient.accountExpires ? this.patient.accountExpires : null
      patientData.passwordExpires = this.patient.passwordExpires ? this.patient.passwordExpires : null
      patientData.idPasswdRenewalPeriod = this.patient.idPasswdRenewalPeriod ? this.patient.idPasswdRenewalPeriod : null
    }

    this.loaderSvc.show();
    try {
      const res = this.idPatient ? await lastValueFrom(this.patientSvc.editarPaciente(this.patient.idUserAgendamiento, patientData)) : await lastValueFrom(this.patientSvc.createPatient(patientData));
      if (res.ok) {
        if (this.idPatient) {
          const nameAntes = String(this.patient.name).split(' ') || '';
          const lastNameAntes = String(this.patient.lastName).split(' ') || '';
          const antes = {
            ...this.patient,
            idPatient: this.idPatient ? +this.idPatient : 0,
            idNationality: this.patient.idCountry || 0,
            userName: this.patient.userName,
            idUser: this.patient.idUser,
            idUserAction: this.shadedSVC.obtenerIdUserAction(),
            firstName: nameAntes[0] || '',
            secondName: nameAntes[1] || '',
            firstLastName: lastNameAntes[0] || '',
            secondLastName: lastNameAntes[1] || ''
          }
          this.trazabilidad(antes, patientData, 2, 'Edición');
        }else{
          this.trazabilidad(null, patientData, 2, 'Creación');
        }

        const successMessage = `¡Paciente ${this.idPatient ? 'actualizado' : 'agregado'} al sistema correctamente!`;
        this.modalService.openStatusMessage('Aceptar', successMessage, '1');
        this.router.navigate(['/inicio/agenda-general/actualizar-datos']);
      } else {
        this.modalService.openStatusMessage('Aceptar', res.message, '4');
      }

      this.loaderSvc.hide();

    } catch (error) {
      this.loaderSvc.hide();

      const errorMessage = `Error al ${this.idPatient ? 'actualizar' : 'crear'} paciente. Intente nuevamente.`;

      this.modalService.openStatusMessage('Volver', errorMessage, '4');
    }
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  get fv() {
    return this.formRegister.value
  }
  get fc() {
    return this.formRegister.controls
  }

  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.title-form').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.form'), 'height', `${he}px`);
  }

  cancelar() {
    this.router.navigate(['/inicio/agenda-general/actualizar-datos'])
  }

  validarQueSeanIguales(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const nueva = formGroup.get('email');
      const confirma = formGroup.get('confirmEmail');

      if (!nueva || !confirma) {
        return null;
      }

      // Verifica si ambos campos son iguales
      if (nueva.value !== confirma.value) {
        // Añade el error al FormGroup
        confirma.setErrors({ 'EqualsEmail': true });
        return { 'EqualsEmail': true };
      }

      // Limpia los errores si coinciden
      confirma.setErrors(null);
      return null;
    };
  }

  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const emailPattern = /^[a-zA-Z0-9._%+-ñÑ]+@[a-zA-Z0-9.-ñÑ]+\.[a-zA-Z]{2,}$/;
      const valid = emailPattern.test(control.value);
      return valid ? null : { 'email': true };
    };
  }
}
