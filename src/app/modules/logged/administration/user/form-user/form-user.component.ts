import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '../../../../../shared/inputs/toggle/toggle.component';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { UsersService } from '../../../../../services/usuarios/users.service';
import { JsonPipe, NgClass } from '@angular/common';
import { ModalService } from '../../../../../services/modal/modal.service';
import { RolesService } from '../../../../../services/roles/roles.service';
import { UpdatePassUser, User } from '../../../../../shared/interfaces/usuarios/users.model';
import { passwordValidator } from '@app/shared/globales/Validator/passValidator';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-form-user',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    BasicInputComponent,
    ToggleComponent,
    NgClass
  ],
  templateUrl: './form-user.component.html',
  styleUrl: './form-user.component.scss'
})
export class FormUserComponent {

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  formRegistro = this.fb.group({
    idIdentificationType: ['', [Validators.required]],
    identificationNumber: ['', [Validators.required]],
    name: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    idCountry: ['', [Validators.required]],
    idDepartment: ['', [Validators.required]],
    idCity: ['', [Validators.required]],
    birthday: ['', [Validators.required]],
    userName: ['', [Validators.required]],
    biologicalSex: ['', [Validators.required]],
    phonePrincipal: ['', [Validators.required]],
    email: ['', [Validators.required, this.emailValidator()]],
    idRole: ['', [Validators.required]],
    expirationDate: ['',],
    passwordExpirationDate: ['',],
    idPasswdRenewalPeriod: [''],
    password: ['',],
  },
    //  { validators: this.validarQueSeanIguales() }
  );



  documentsTypes: any[] = [];
  biologicalSexList: any[] = [];
  departamentos: any[] = [];
  cuidades: any[] = [];
  paises: any[] = [];
  roles: any[] = [];
  renovacionesPeriodicas: any[] = [];


  isEdit: boolean = false;
  flatExpiracion: boolean = false;
  flatRenovacionContrasena: boolean = false;
  abrirTomarFoto: boolean = false;
  eliminarActive: boolean = false;

  fotoSubida: boolean = false;
  iconoActual: 'remove' | 'close' | 'check' = 'remove'
  currentBase64: string = ''
  imageSrc: string = ''
  extension: string | undefined = ''

  userId: number = 0;
  user: any = {};
  permisosDelModulo: any = {};

  fechaActual = new Date()


  constructor(
    private fb: FormBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private shadedSVC: SharedService,
    private loaderSvc: LoaderService,
    private rolesSvc: RolesService,
    private userSvc: UsersService,
    private loaderService: LoaderService,
    private modalSvc: ModalService,
    private activateR: ActivatedRoute,
    private tzs: TrazabilidadService,
  ) {

    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Usuarios')
    this.activateR.params.subscribe(params => {

      let userId = params['idUser'];
      if (userId) {
        this.userId = Number(userId);
        this.isEdit = true;
        if (!this.permisosDelModulo.Editar) {
          this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
          this.cancelar()
        }
      }
    });
  }

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  async ngOnInit(): Promise<void> {
    this.filtrosPaises();
    await this.getDocuments()
    await this.getRoles()
    await this.getBiologicalSex()
    await this.listadoDePeriodosdeRenovacionContrasena()
    await this.getCountries()

    this.validaPass();

    await this.getUser()
  }

  trazabilidad(antes:any,despues:any | null,idMovimiento:number,movimiento:string){
    const dataTrazabilidad:dataTrazabilidad= {
        datos_actuales: antes,
        datos_actualizados: despues,
        idModulo: 7,
        idMovimiento,
        modulo: "Administración",
        movimiento,
        subModulo: "Usuarios"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  validaPass(){
    this.formRegistro.get('password')?.valueChanges.subscribe(x =>{
      if(x ){
        this.formRegistro.get('password')?.setValidators([passwordValidator()])
      }else{
        this.formRegistro.clearAsyncValidators();
      }
      this.formRegistro.updateValueAndValidity();
    });
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const emailPattern = /^[a-zA-Z0-9._%+-ñÑ]+@[a-zA-Z0-9.-ñÑ]+\.[a-zA-Z]{2,}$/;
      const valid = emailPattern.test(control.value);
      return valid ? null : { 'email': true };
    };
  }

  get fv() {
    return this.formRegistro.value
  }
  get fc() {
    return this.formRegistro.controls
  }

  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.title-form').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.form'), 'height', `${he}px`);
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

  async getRoles() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando roles' })
      let items = await lastValueFrom(this.rolesSvc.getAllRoles());
      if (items.data) {
        this.roles = items.data;
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
      let biological = await lastValueFrom(this.shadedSVC.biologicalSex());
      if (biological.data) {
        this.biologicalSexList = biological.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }
  async listadoDePeriodosdeRenovacionContrasena() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando listado' })
      let items = await lastValueFrom(this.userSvc.listadoDePeriodosdeRenovacionContrasena());
      if (items.data) {
        this.renovacionesPeriodicas = items.data;
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
          if (this.user.IdDepartment) {
            this.fc.idDepartment.setValue(this.user.IdDepartment)
            this.user.IdDepartment = null
          }

        }, 100);
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }
  async getCities(department: any) {
    try {

      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando cuidades' })
      this.fc.idCity.reset()
      let items = await lastValueFrom(this.shadedSVC.getCities(department));
      if (items.data) {
        this.cuidades = items.data;
        setTimeout(() => {
          if (this.user.IdCity) {
            this.fc.idCity.setValue(this.user.IdCity)
            this.user.IdCity = null
          }
        }, 100);


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
      let items = await lastValueFrom(this.shadedSVC.getCountries());
      if (items.data) {
        this.paises = items.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }
  async getUser() {
    try {
      if (this.userId && this.isEdit) {
        this.loaderSvc.show()
        this.loaderSvc.text.set({ text: 'Cargando usuario' })
        let item = await lastValueFrom(this.userSvc.getUserById(this.userId));

        if (item.data) {


          this.user = item.data[0];

          let d = item.data[0];
          this.fc.idIdentificationType.setValue(d.idIdentificationType)
          this.fc.identificationNumber.setValue(d.identificationNumber)
          this.fc.name.setValue(d.name)
          this.fc.lastName.setValue(d.lastName)
          this.fc.idCountry.setValue(d.idCountry)
          this.fc.idDepartment.setValue(d.idDepartment)
          this.fc.idCity.setValue(d.idCity)

          this.fc.birthday.setValue(d.birthDate)
          this.fc.userName.setValue(d.userName)
          this.fc.biologicalSex.setValue(d.idBiologicalSex)
          this.fc.phonePrincipal.setValue(d.phone)
          this.fc.email.setValue(d.email)
          this.fc.idRole.setValue(d.idRole)

          if (d.accountExpires) {
            this.setExpiracionCuenta(d.accountExpires)
            this.fc.expirationDate.setValue(d.expirationDate)
          }
          if (d.passwordExpires) {
            this.setRenovacionContrasena(d.passwordExpires)
            setTimeout(() => {
              this.fc.idPasswdRenewalPeriod.setValue(d.idPasswdRenewalPeriod)
            }, 100);
          }

          setTimeout(() => {

          }, 1000);
          this.fc.password.setValue('')

          if (d.photoNameContainer) {
            await this.consultarFoto(d.photoNameContainer)
          }
        }
        this.loaderSvc.hide()
      }
    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  async consultarFoto(nameContainer: string) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando foto' })
      let item = await lastValueFrom(this.userSvc.getUserPhoto(nameContainer));
      if (item.data) {

        this.fotoSubida = true
        this.imageSrc = `data:image/png;base64,${item.data}`;
        this.abrirTomarFoto = true;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  cancelar() {
    this.router.navigate(['/inicio/administracion/usuarios'])
  }

  async createUser() {


    if (this.formRegistro.valid) {

      try {
        let user: User = {
          idUser: this.isEdit ? this.userId : 0,
          idIdentificationType: Number(this.fv.idIdentificationType),
          identificationNumber: String(this.fv.identificationNumber?.trim()),
          name: String(this.fv.name?.trim()),
          lastName: String(this.fv.lastName?.trim()),
          idCountry: Number(this.fv.idCountry),
          idCity: Number(this.fv.idCity),
          idDepartment: Number(this.fv.idDepartment),
          idBiologicalSex: Number(this.fv.biologicalSex),
          birthDate: String(this.shadedSVC.formatearFecha(this.fv.birthday)),
          userName: String(this.fv.userName?.trim()),
          email: String(this.fv.email?.trim()),
          idRole: Number(this.fv.idRole),
          idProfession: 0,
          registrationNumber: null,
          phone: String(this.fv.phonePrincipal?.trim()),
          accountExpires: this.flatExpiracion,
          passwordExpires: this.flatRenovacionContrasena,
          photoNameContainer: this.currentBase64 ? this.currentBase64 : this.user.PhotoNameContainer,
          extensionPhoto: this.currentBase64 ? this.extension : null,
          active: this.isEdit ? this.user.active : true,
          idUserAction: this.shadedSVC.obtenerIdUserAction(),
          fullNameUserAction: this.nombreUsuario,
          expirationDate:null,
          idPasswdRenewalPeriod:0
        }

        if (this.flatExpiracion) {
          user.expirationDate = String(this.shadedSVC.formatearFecha(this.fv.expirationDate))
        }

        if (this.flatRenovacionContrasena) {
          user.idPasswdRenewalPeriod = Number(this.fv.idPasswdRenewalPeriod)
        }


        if (this.isEdit) {
          if (this.fv.password) {
            let cambio = await this.renovarConstrasena(this.fv.password)
            if (!cambio) {
              return this.modalSvc.openStatusMessage('Aceptar', '¡Ocurrio un error al cambiar la contraseña del usuario!', '4', ' Intente de nuevo')
            }
          }
        }

        this.loaderSvc.show();
        this.loaderSvc.text.set({ text: 'Guardando usuario' });
        let response = await lastValueFrom(this.userSvc.createUpdateUser(user));
        this.loaderSvc.hide();
        if (response.ok) {
          if (this.isEdit) {
            const despues= {
              ...user,
              passwordExpirationDate:this.user.passwordExpirationDate,
              photoNameContainer:this.user.photoNameContainer,
              signatureNameContainer:this.user.signatureNameContainer,
              encryptedUser:this.user.encryptedUser,
              encryptedUserDate:this.user.encryptedUserDate,
              sessionDate:this.user.sessionDate,
              photo:user.photoNameContainer,
              active:this.user.active
            }
            this.trazabilidad(this.user,despues,2,'Edición');
            this.modalSvc.openStatusMessage('Aceptar', '¡Usuario actualizado en el sistema correctamente!', '1',)
          } else {
            this.trazabilidad(user,null,1,'Creación');
            this.modalSvc.openStatusMessage('Aceptar', '¡Usuario creado en el sistema correctamente!', '1', ' Se ha enviado un correo electronico con las credenciales')
          }
          this.cancelar();
        } else {
          switch (response.message) {
            case "Documento existente":
              this.modalSvc.openStatusMessage('Aceptar', '¡Ya existe un usuario con el número de documento ingresado!', '4')
              break;
            case "Correo existente":
              this.modalSvc.openStatusMessage('Aceptar', '¡El correo registrado ya esta en uso!', '4')
              break;

            default:
              this.modalSvc.openStatusMessage('Aceptar', 'Error al crear el usuario, intente de nuevo', '4')
              break;
          }
        }



      } catch (error) {
        this.loaderSvc.hide();
        return this.modalSvc.openStatusMessage('Aceptar', '¡Ocurrio un error al guardar el usuario!', '4', ' Intente de nuevo')
      }

    } else {
      this.formRegistro.markAllAsTouched()
    }
  }

  async renovarConstrasena(password: string) {
    let obj = {
      // currentPassword:null,
      firstTime:false,
      Renewal:false,
      newPassword: password,
      idUser: this.userId
    }
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Guardando contraseña' });
      let response = await lastValueFrom(this.userSvc.updatePass(obj));
      this.loaderSvc.hide();
      if (response.ok) {
        this.trazabilidad(
          {text:'contraseña -- ***'},
          {text:'Se ha modificado la contraseña',idUserAction:this.idUser,fullNameUserAction:this.nombreUsuario},
          2,
          'Edición'
        );
        return true
      } else {
        return false
      }
    } catch (error) {
      this.loaderSvc.hide();
      return false
    }

  }
  setExpiracionCuenta($event: any) {
    this.flatExpiracion = $event
    if ($event) {
      this.fc.expirationDate.setValue('');
      this.fc.expirationDate.addValidators(Validators.required);
      this.fc.expirationDate.updateValueAndValidity();

    } else {
      this.fc.expirationDate.setValue('');
      this.fc.expirationDate.clearValidators();
      this.fc.expirationDate.updateValueAndValidity();
    }
  }
  setRenovacionContrasena($event: any) {

    this.flatRenovacionContrasena = $event
    if ($event) {
      setTimeout(() => {
        this.fc.idPasswdRenewalPeriod.setValue('');
        this.fc.idPasswdRenewalPeriod.addValidators(Validators.required);
        this.fc.idPasswdRenewalPeriod.updateValueAndValidity();
      }, 100);


    } else {
      setTimeout(() => {
        this.fc.idPasswdRenewalPeriod.setValue('');
        this.fc.idPasswdRenewalPeriod.clearValidators();
        this.fc.idPasswdRenewalPeriod.updateValueAndValidity();
      }, 100);

    }
  }

  onMouseEnter() {
    this.iconoActual = 'close';
    this.eliminarActive = true;
  }

  onMouseLeave() {
    this.iconoActual = 'check';
    this.eliminarActive = false;
  }

  openPhotoSelector() {
    this.abrirTomarFoto = !this.abrirTomarFoto
    return

  }

  openDownloader(id: any) {
    const FILEUPLOAD = document.getElementById(id) as HTMLInputElement
    FILEUPLOAD.click()
  }

  async loadFileSeguimiento($event: any) {

    const input = $event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      // Obtener la extensión del archivo
      this.extension = file.name.split('.').pop()?.toLowerCase();



      reader.onload = () => {
        this.imageSrc = reader.result as string;
        this.currentBase64 = this.imageSrc.split(',')[1];
        this.confirmacionFoto(true);
      };

      reader.readAsDataURL(file);
    }
  }

  openCamera(): void {
    this.loaderService.show()
    this.loaderService.text.set({ text: 'Tomando foto' })
    const videoElement = document.createElement('video');
    const canvasElement = document.createElement('canvas');
    const context = canvasElement.getContext('2d');

    // Pedir permiso para usar la cámara del dispositivo
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        this.loaderService.hide()
        videoElement.srcObject = stream;
        videoElement.play();
        this.loaderService.show()
        this.loaderService.text.set({ text: 'Tomando foto' })
        // Esperar un segundo para que la cámara se active
        setTimeout(() => {
          // Establecer el tamaño del canvas
          this.loaderService.hide()
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;

          // Dibujar la imagen del video en el canvas
          context?.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

          // Parar el video y liberar el stream
          videoElement.pause();
          stream.getTracks().forEach(track => track.stop());

          // Obtener la imagen como data URL
          this.imageSrc = canvasElement.toDataURL('image/png');
          this.currentBase64 = this.imageSrc.split(',')[1];
          this.extension = 'png'
          this.confirmacionFoto(true);

        }, 1000);
      })
      .catch(error => {
        this.loaderService.hide()

      });
  }

  confirmacionFoto(estado: boolean) {
    this.fotoSubida = estado;
    if (estado) {
      this.iconoActual = 'check'
    } else {
      this.iconoActual = 'remove'
    }
  }

  eliminarFoto() {
    this.confirmacionFoto(false);
    this.currentBase64 = '';
    this.imageSrc = ""
    this.eliminarActive = false;
  }


}
