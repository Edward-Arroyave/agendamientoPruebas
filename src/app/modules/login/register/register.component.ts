import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../shared/inputs/basic-input/basic-input.component';
import { SharedService } from '../../../services/servicios-compartidos/shared.service';
import { LoaderService } from '../../../services/loader/loader.service';
import { User } from '../../../shared/interfaces/usuarios/users.model';
import { UsersService } from '../../../services/usuarios/users.service';
import { Patient } from '../../../shared/interfaces/pacientes/patient.model';
import { PatientService } from '../../../services/pacientes/patient.service';
import { AuthService } from '@app/services/autenticacion/auth..service';
import { ModalService } from '@app/services/modal/modal.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatTooltipModule, RouterLink, BasicInputComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  ngAfterViewInit() {
    this.ajustarAlto();
  }
  documentsTypes: any[] = [];
  biologicalSexList: any[] = [];
  paises: any[] = [];
  departamentos: any[] = [];
  cuidades: any[] = [];

  formRegistro = this.fb.group({
    idCity: ['', [Validators.required]],
    idDepartment: ['', [Validators.required]],
    idCountry: ['', [Validators.required]],
    documentType: ['', [Validators.required]],
    documentNumber: ['', [Validators.required]],
    firstname: ['', [Validators.required]],
    secondname: ['',],
    firtsLastName: ['', [Validators.required]],
    secondLastName: [''],
    birthday: ['', [Validators.required]],
    adress: ['', [Validators.required]],
    email: ['', [Validators.required, this.emailValidator()]],
    confirmEmail: ['', [Validators.required]],
    biologicalSex: ['', [Validators.required]],
    telephone: ['', [Validators.required]],
    telephone2: ['',],
  }, { validators: this.validarQueSeanIguales() });

  maxDate = new Date()


  constructor(private fb: FormBuilder, private elRef: ElementRef, private renderer: Renderer2, private sharedSvc: SharedService,
    private router: Router, private shadedSVC: SharedService, private loaderSvc: LoaderService, private modalSvc: ModalService,
    private userSvc: UsersService, private patientSvc: PatientService) {

  }

  async ngOnInit(): Promise<void> {
    sessionStorage.setItem('tokenHis', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcmltYXJ5c2lkIjoiMzYiLCJJZEF0dGVudGlvbkNlbnRlciI6IjAiLCJPcmlnaW4iOiIyIiwibmJmIjoxNzI3Mjg1ODQyLCJleHAiOjE3MjczNzIyNDIsImlhdCI6MTcyNzI4NTg0Mn0.F8DHT7-6UuORQ4-RyFgszvd8Q8LkCmdp1aGiKS2RZY4')
    await this.getDocuments()
    await this.getCountries()
    await this.getBiologicalSex()
    this.filtrosPaises()

  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  get fv() {
    return this.formRegistro.value
  }
  get fc() {
    return this.formRegistro.controls
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

  private ajustarAlto() {

    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.header').offsetHeight;

    let he = container - header - 300;

    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.form-registro'), 'height', `${he}px`);
  }



  async getDocuments() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando tipos de documento' })
      let documents = await this.shadedSVC.documentsTypes().toPromise();
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
      let biological = await this.shadedSVC.biologicalSex().toPromise();
      if (biological.data) {
        this.biologicalSexList = biological.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }


  async createPatient() {

    if (this.formRegistro.valid) {
      try {

        let date
        if (this.fv.birthday) {
          date = this.sharedSvc.formatearFecha(new Date(this.fv.birthday));
        }

        let patient: Patient = {
          idPatient: 0,
          idNationality: 0,
          idCity: Number(this.fv.idCity),
          idCountry: Number(this.fv.idCountry),
          idDepartment: Number(this.fv.idDepartment),
          idIdentificationType: Number(this.fv.documentType),
          identificationNumber: String(this.fv.documentNumber),
          firstName: String(this.fv.firstname),
          secondName: this.fv.secondname? String(this.fv.secondname): "",
          firstLastName: String(this.fv.firtsLastName),
          secondLastName: this.fv.secondLastName? String(this.fv.secondLastName): "",
          birthDate: String(date),
          idBiologicalSex: Number(this.fv.biologicalSex),
          address: String(this.fv.adress),
          telephone: String(this.fv.telephone),
          telephone2: this.fv.telephone2 ? String(this.fv.telephone2) : "",
          email: String(this.fv.email),
          idUserAction: 0
        }


        this.loaderSvc.show()
        this.loaderSvc.text.set({ text: 'Guardando paciente' })
        let usuario = await this.patientSvc.createPatient(patient).toPromise();
        if (usuario.ok) {
          this.modalSvc.openStatusMessage('Aceptar', 'Paciente creado correctamente', '1', 'Se enviaron las credenciales al correo registrado')
          this.router.navigate(['/login'])
        } else {
          switch (usuario.message) {
            case "Documento existente":
              this.modalSvc.openStatusMessage('Aceptar', '¡Ya existe un usuario con el número de documento ingresado!', '4')
              break;
            case "Correo existente":
              this.modalSvc.openStatusMessage('Aceptar', '¡El correo registrado ya esta en uso', '4')
              break;
            case "Username existente":
              this.modalSvc.openStatusMessage('Aceptar', '¡El usuario ya esta registrado en el sistema', '4')
              break;

            default:
              this.modalSvc.openStatusMessage('Aceptar', 'Error al crear el paciente, intente de nuevo', '4')
              break;
          }



        }
        this.loaderSvc.hide()
      } catch (error) {
        this.loaderSvc.hide()
        this.modalSvc.openStatusMessage('Aceptar', 'Error al crear el paciente, intente de nuevo', '4')
        console.error(error)
      }
    } else {

      this.formRegistro.markAllAsTouched();
    }



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

  cancelar() {
    this.router.navigate(['/login'])
  }

  async getCountries() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando paises' })
      let items = await this.shadedSVC.getCountries().toPromise();
      if (items.data) {
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
      let items = await this.shadedSVC.getDepartaments(pais).toPromise();
      if (items.data) {
        this.departamentos = items.data;
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
      this.loaderSvc.text.set({ text: 'Cargando cuidades' })
      let items = await this.shadedSVC.getCities(idDepartment).toPromise();
      if (items.data) {
        this.cuidades = items.data;

      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }


}


