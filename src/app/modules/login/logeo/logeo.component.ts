import { Component, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../shared/inputs/basic-input/basic-input.component';
import { NgClass } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { RECAPTCHA_SETTINGS, RecaptchaFormsModule, RecaptchaModule } from 'ng-recaptcha';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { ModalService } from '../../../services/modal/modal.service';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { ModalData } from '../../../shared/globales/Modaldata';
import { MatDialog } from '@angular/material/dialog';
import { ModalGeneralComponent } from '../../../shared/modals/modal-general/modal-general.component';
import { FieldErrors } from '../../../shared/globales/getFieldError';
import { LoaderService } from '../../../services/loader/loader.service';
import { AuthService } from '../../../services/autenticacion/auth..service';
import { HttpErrorResponse } from '@angular/common/http';
import { jwtDecode } from "jwt-decode";
import { UserUpdatePassword } from '../../../shared/interfaces/usuarios/users.model';
import { ConfiguracionVisualService } from '@app/services/configuracion-visual/configuracion-visual';
import { ChangeThemeService } from '@app/services/cambio-tema/change-theme.service';
import { passwordValidator } from '@app/shared/globales/Validator/passValidator';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';

@Component({
  selector: 'app-logeo',
  standalone: true,
  imports: [FormsModule, MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatTooltipModule, RouterLink, BasicInputComponent, NgClass, MatCheckbox, RecaptchaFormsModule, RecaptchaModule],
  templateUrl: './logeo.component.html',
  styleUrl: './logeo.component.scss',
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        //Test, dev, demo, localhost,
        siteKey: '6Lc-WjwqAAAAALVB9MOoYSzc2ra0pH4eFdcmuc02',
        secretKey: '6LdqVjwqAAAAAOQE-wypJlPf0WmXYdK6oMkpBwc_'
        //Ambiente de producción
        //siteKey: '6Lc-WjwqAAAAALVB9MOoYSzc2ra0pH4eFdcmuc02',
        //  secretKey : '6Lc-WjwqAAAAAG0a6qWBgWjkWiuUj5EK5ZPQFuL9'
      }
    },
  ],
})
export class LogeoComponent {

  isAdmin: boolean = false;
  isFirtsTime: boolean = false;
  renewal: boolean = false;
  currentTheme: string = 'light-theme';
  documentsTypes: any[] = [];

  login = this.fb.group({
    userName: [sessionStorage.getItem('username') || '', [Validators.required]],
    password: ['', [Validators.required]],
    recaptcha: ['', [Validators.required]],
    remember: [sessionStorage.getItem('rememberUser')],
  });

  recuperar = this.fb.group({
    // correoElectronico: ['', [Validators.required, this.emailValidator()]],
    identificationNumber: ['', [Validators.required, Validators.minLength(4)]],
    identificationType: ['', [Validators.required]],
    code: ['', [Validators.required]],
  });

  cambiar = this.fb.group({
    actual: [''],
    nueva: ['', [Validators.required,passwordValidator()]],
    confirma: ['', [Validators.required,passwordValidator()]]
  }, { validators: this.validarQueSeanIguales() });

  currentLogin: 'login' | 'recuperar' | 'cambiar' | 'codigo' = 'login'
  contadorReenvio: number = 0;
  intervalId: any;
  currentCodigo: any;
  currentIdUser: any;

  fieldError = new FieldErrors();
  @ViewChild('expirar', { static: false }) expirar: TemplateRef<any> | any;
  isCode = false;

  constructor(private fb: FormBuilder, private modalService: ModalService, private activRoute: ActivatedRoute,
    private dialog: MatDialog, private router: Router, private loaderSvc: LoaderService, private changueThemeSVC: ChangeThemeService,
    private confVisualSvc: ConfiguracionVisualService, private authSvc: AuthService,private shadedSVC: SharedService) {

    this.activRoute.params.subscribe(params => {
      let code = params['code'];
      if (code) {
        this.currentCodigo = Number(code);
        this.recuperar.get('code')?.setValue(this.currentCodigo)
        this.isCode = true;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.cambiarTab(1)
    if (this.isCode) {
      this.changeTab('cambiar')
    }

    this.getDocuments()
  }



  cambiarTab(tab: number) {

    switch (tab) {
      case 1:
        this.changueThemeSVC.cambiarTema('bluesh-green')
        this.changueThemeSVC.cambiarFuente("Mulish , Mulish-Bold, Mulish-ExtraBold")
        this.isAdmin = false;
        break;
      case 2:
        this.changueThemeSVC.cambiarTema('bluesh-green-invert')
        this.changueThemeSVC.cambiarFuente("Mulish , Mulish-Bold, Mulish-ExtraBold")
        this.isAdmin = true;
        break;

      default:
        break;
    }

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

  resolved(captchaResponse: any) {
    this.login.get("recaptcha")?.setValue(captchaResponse);
  }

  get fv() {
    return this.login.value;
  }
  get fc() {
    return this.login.controls;
  }


  async ingresar() {

    this.loaderSvc.show();
    this.loaderSvc.text.set({ text: 'Iniciando sesión' })
    if (this.login.invalid) {
      this.login.markAllAsTouched();
      this.loaderSvc.hide();
      return;
    } else {

      let login = {
        userName: this.fv.userName?.trim(),
        password: this.fv.password?.trim(),
        typeUser: this.isAdmin ? 1 : 2
      }

      this.authSvc.login(login).subscribe(async (data: any) => {
        this.loaderSvc.hide();

        if (data.ok) {
          if (this.fv.remember && this.fv.userName) {
            sessionStorage.setItem('username', this.fv.userName.trim())
            sessionStorage.setItem('rememberUser', this.fv.remember ? this.fv.remember : '')
          }
          this.login.reset();
          try {
            this.loaderSvc.show()
            this.loaderSvc.text.set({ text: 'Cargando configuración visual' })
            let response: any = await lastValueFrom(this.confVisualSvc.getConfiguracionVisual());
            this.loaderSvc.hide()
            if (response.ok && response.data) {

              let x = response.data

              sessionStorage.setItem('color', x.colorPalette);
              sessionStorage.setItem('tipografia', x.idTypography);
              sessionStorage.setItem('titulo', x.titleEntry);
              sessionStorage.setItem('texto', x.textEntry);
              sessionStorage.setItem('favicon', x.logoFaviconBase64);
              sessionStorage.setItem('logo', x.mainLogoBase64);
              sessionStorage.setItem('logoFooter', x.logoFooterBase64);
              sessionStorage.setItem('mainImagen', x.fileLoadBase64);
              sessionStorage.setItem('text', x.textEntry);
              sessionStorage.setItem('title', x.titleEntry);

            }

          } catch (error) {
            this.loaderSvc.hide()
          }

          this.router.navigate(['inicio']);
        } else {
          this.loaderSvc.hide()

          let codigoDesencriptado: any = {}
          if (data.data) {
            codigoDesencriptado = this.desencriptarToken(data.data);
          }

          switch (data.message) {
            case 'Usuario no permitido':
              this.openModalStatus('Aceptar', `¡Su usuario no es un ${this.isAdmin ? 'administrador' : 'paciente'} `, '3', `Por favor ingrese en la parte de ${this.isAdmin ? 'paciente' : 'administrador'}.`);
              break;
            case 'Primera sesión':
              let codigoDesencriptado: any = this.desencriptarToken(data.data);
              this.openModalStatus('Aceptar', '¡Es su primer inicio de sesión!', '3', 'Por favor cambie su contraseña.');
              this.currentLogin = 'cambiar';
              this.cambiar.get('actual')?.setValidators(Validators.required);
              this.cambiar.get('actual')?.updateValueAndValidity;
              this.authSvc.setToken(data.data)
              this.currentIdUser = codigoDesencriptado.IdUser;
              this.isFirtsTime = true;
              this.renewal = false;
              break;

            case 'Renovar pass':
              //Decodificar token para saber el id user:

              let code : any = this.desencriptarToken(data.data);


              this.openModalStatus('Aceptar', '¡Su contraseña ha expirado!', '3', 'Por favor cambie su contraseña.');
              this.currentLogin = 'cambiar';
              this.authSvc.setToken(data.data)
              this.currentLogin = 'cambiar';
              this.cambiar.get('actual')?.setValidators(Validators.required);
              this.cambiar.get('actual')?.updateValueAndValidity;
              this.authSvc.setToken(data.data)

              this.currentIdUser = code.IdUser;
              this.isFirtsTime = false;
              this.renewal = true;
              break;
            case 'Su usuario ha expirado':
              this.openModalStatus('Aceptar', '¡Su usuario ha expirado!', '4', 'Por favor comuniquese con el administrador.');
              break;
            case 'Usuario inactivo':
              this.openModalStatus('Aceptar', '¡Su usuario ha expirado!', '4', 'Por favor comuniquese con el administrador.');
              break;
            case 'Ha ocurrido un error, verifique sus credeneciales':
              this.modalService.openStatusMessage('Aceptar', 'Usuario o contraseña invalidos', '4')
              break;


            default:
              break;
          }
          // this.openModalExpirar(this.expirar)


        }


      }, (err: HttpErrorResponse) => {

        this.loaderSvc.hide();
        this.modalService.openStatusMessage('Aceptar', 'Ha ocurrido un error al iniciar sesion', '4', 'Intente de nuevo')



      });


    }
  }



  changeTab(tab: 'login' | 'recuperar' | 'cambiar' | 'codigo') {
    this.currentLogin = tab;
  }

  cancelar() {
    this.router.navigate(['/login'])
    this.isAdmin = false;

    this.changeTab('login');
    this.recuperar.get('code')?.setValue('');
    this.currentCodigo = undefined
    this.currentIdUser = undefined
    this.isFirtsTime = false;
    this.renewal = false;
    this.recuperar.reset();
    this.cambiar.reset();
    this.login.reset();
  }

  openModalExpirar(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {
    const destroy$: Subject<boolean> = new Subject<boolean>();
    /* Variables  recibidas por el modal */
    const data: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: 'Cerrar',
      footer: true,
      title: titulo,
      type: '2',
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      dialogRef.close();
    });
  }

  async recuperarConEmail(code: string) {
    if (this.recuperar.get("identificationNumber")?.valid && this.recuperar.get("identificationType")?.valid) {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Enviado correo' });
      const URLactual = window.location.href;
      try {
        let response = await this.authSvc.sendEmailCode(this.recuperar.value).toPromise();
        this.loaderSvc.hide()
        if (response.ok) {
          let codigoDesencriptado: any = this.desencriptarToken(response. data);
          this.currentIdUser = codigoDesencriptado.IdUser;
          this.authSvc.setToken(response.data)
          this.openModalStatus('Aceptar', '¡Correo enviado correctamente!', '1', 'Se ha enviado un mensaje a su correo electrónico para restablecer su contraseña.');
        } else {
          this.openModalStatus('Aceptar', response.message, '4', 'Por favor comuníquese con el administrador');
          return
        }
      } catch (error) {
        this.loaderSvc.hide()
        this.openModalStatus('Aceptar', '¡El correo electrónico no se encuentra asociado a un usuario o está inactivo!', '4', 'Por favor comuníquese con el administrador.');
        return
      }

      this.recuperar.get('code')?.setValue(code);
      this.currentLogin = 'codigo'
      this.reiniciarContador();

    } else {
      this.recuperar.get('correoElectronico')?.markAllAsTouched();
    }
  }



  async confirmarCodigo() {

    if (this.recuperar.get('code')?.value) {
      try {
        this.loaderSvc.show();
        this.loaderSvc.text.set({ text: 'Enviado correo' });
        let codigo = this.recuperar.get('code')?.value
        let response = await this.authSvc.confirmCode(codigo?.trim(), this.currentIdUser).toPromise();
        this.loaderSvc.hide();
        if (response.ok) {
          this.currentLogin = 'cambiar'
        } else {
          this.modalService.openStatusMessage('Reintentar', '¡El código ingresado no es valido!', '4')
        }
      } catch (error) {
        this.loaderSvc.hide();
        this.reiniciarContador()
      }
    } else {
      this.recuperar.get('code')?.markAllAsTouched();
    }
  }

  //Contador

  reiniciarContador() {
    this.contadorReenvio = 10;

    // Limpia cualquier intervalo previo
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Crea un nuevo intervalo que se ejecuta cada segundo
    this.intervalId = setInterval(async () => {
      this.contadorReenvio--;

      if (this.contadorReenvio === 0) {
        if (this.currentCodigo) {
          try {
            this.loaderSvc.show();
            this.loaderSvc.text.set({ text: 'Enviado correo' });
            let response = await this.authSvc.deleteCode(this.currentIdUser).toPromise();
            this.loaderSvc.hide();
            if (response.ok) {
            } else {
            }
          } catch (error) {
            this.loaderSvc.hide();

          }
        }

        clearInterval(this.intervalId);  // Detiene el contador cuando llega a 0
      }
    }, 1000);  // 1000 ms = 1 segundo
  }



  validarQueSeanIguales(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const nueva = formGroup.get('nueva');
      const confirma = formGroup.get('confirma');

      if (!nueva || !confirma) {
        return null;
      }

      // Verifica si ambos campos son iguales
      if (nueva.value !== confirma.value) {
        // Añade el error al FormGroup
        confirma.setErrors({ 'Equals': true });
        return { 'Equals': true };
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

  async actualizarContrasena() {
    if (this.cambiar.valid) {
      try {
        this.loaderSvc.show()
        this.loaderSvc.text.set({ text: 'Cambiando contraseña' })

        let obj: UserUpdatePassword = {
          currentPassword: this.cambiar.get('actual')?.value ? String(this.cambiar.get('actual')?.value) : null,
          newPassword: String(this.cambiar.get('nueva')?.value),
          idUser: this.currentIdUser,
          FirstTime: this.isFirtsTime,
          Renewal: this.renewal
        }
        let response = await this.authSvc.updatePassword(obj).toPromise()
        this.loaderSvc.hide()
        if (response.ok) {
          this.openModalStatus('Aceptar', '¡Contraseña actualizada en el sistema correctamente!', '1');
          this.cancelar();
        } else {
          this.openModalStatus('Aceptar', '¡La contraseña anterior es incorrecta!', '3');
        }


      } catch (error) {
        this.loaderSvc.hide()
        this.openModalStatus('Aceptar', '¡Ocurrio un error al cambiar la contraseña!', '4');
      }
    } else {
      this.cambiar.markAllAsTouched();
    }


  }

  openModalStatus(btn: string, mensaje: string, type: string, message2?: string) {
    this.modalService.openStatusMessage(btn, mensaje, type, message2)
  }

  desencriptarToken(code: string) {
    const decoded = jwtDecode(code);
    return decoded;
  }



}
