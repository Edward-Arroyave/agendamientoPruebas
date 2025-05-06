import { Component, ElementRef, HostListener, Renderer2, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, lastValueFrom, Subject, takeUntil, throwError } from 'rxjs';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { RolesService } from '../../../../../services/roles/roles.service';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { UsersService } from '../../../../../services/usuarios/users.service';
import { ModalData } from '../../../../../shared/globales/Modaldata';
import { User, UserChangueSatus } from '../../../../../shared/interfaces/usuarios/users.model';
import { ModalGeneralComponent } from '../../../../../shared/modals/modal-general/modal-general.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '../../../../../shared/inputs/toggle/toggle.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-list-user',
  standalone: true,
  imports: [FormsModule, MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatTooltipModule, RouterLink, BasicInputComponent, ToggleComponent, ScrollingModule],
  templateUrl: './list-user.component.html',
  styleUrl: './list-user.component.scss'
})
export class ListUserComponent {

  formSearch = this.fb.group({
    idIdentificationType: [''],
    identificationNumber: [''],
    firstName: [''],
    firstLastName: [''],
  });

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  listUsers: any[] = [];
  listUsersCopy: any[] = [];
  tiposDocumentos: any[] = [];


  correoUsuario: string = ''
  permisosDelModulo: any;


  currentPage = 0;
  finalPage = 30;
  public loadingData: boolean = false;
  public finishData: boolean = false;


  @ViewChild('scrollContainer') scrollContainer: ElementRef | undefined;

  constructor(
    private fb: FormBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private dialog: MatDialog,
    private userSvc: UsersService,
    private loaderSvc: LoaderService,
    private modalSvc: ModalService,
    private shadedSVC: SharedService,
    private tzs: TrazabilidadService
  ) {

    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Usuarios')

  }
  async ngOnInit(): Promise<void> {
    this.ajustarAlto()
    await this.listarDocumentos()
    await this.consultAllUsers();
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  trazabilidad(antes:User,despues:User | null,idMovimiento:number,movimiento:string){
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

  private ajustarAlto() {

    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const title = this.elRef.nativeElement.querySelector('.title').offsetHeight;
    const form = this.elRef.nativeElement.querySelector('.form-search').offsetHeight;
    let he = container - title - form - 40;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.users'), 'height', `${he}px`);
  }


  public scrollListUsers(event: Event) {
    const element = event.target as HTMLDivElement;

    // Verificar si el usuario está a una cierta distancia del final de scroll
    if (element.scrollHeight - (element.scrollTop + element.clientHeight) <= 120) {
      if (!this.loadingData && !this.finishData) {
        this.consultAllUsers();
      }
    }
  }



  get fv() {
    return this.formSearch.value
  }



  filterSearch() {
    if (this.fv.firstName || this.fv.firstLastName || this.fv.idIdentificationType || this.fv.identificationNumber) {
      if (this.fv.idIdentificationType && !this.fv.identificationNumber || !this.fv.idIdentificationType && this.fv.identificationNumber) {
        this.modalSvc.openStatusMessage('Aceptar', 'Debe ingresar tipo y número de documento', '3')
        return
      }

      let filtro = {
        idIdentificationType: this.fv.idIdentificationType || 0,
        identificationNumber: this.fv.identificationNumber ||  null,
        firstName: this.fv.firstName || null,
        secondName: null,
        firstLastName: this.fv.firstLastName || null,
        secondLastName: null,
      }

      this.currentPage = 0;
      this.finalPage = 30;

      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando usuarios' });
      this.loadingData = true;

      this.listUsers = []

      this.userSvc.getUsersByFilter(this.currentPage, this.finalPage, filtro).pipe(
        catchError((e: any) => {
          this.loaderSvc.hide();
          setTimeout(() => {
            this.loadingData = false;
          }, 100);
          return throwError(e);
        }),
        finalize(() => {
          this.loaderSvc.hide();
          setTimeout(() => {
            this.loadingData = false;
          }, 100);
        })
      ).subscribe((response: any) => {
        if (response.ok) {
          let usuarios = response.data.map((user: any) => {
            user.tipoDocumento = this.tiposDocumentos.find((documento: any) => documento.idDocumentType == user.idIdentificationType).documentType
            if (user.photo) {
              user.image = `data:image/png;base64,${user.photo}`;
            }
            return user
          })
          this.listUsers = usuarios
          this.finishData = true;
        }else{
          this.modalSvc.openStatusMessage('Aceptar', 'No se encontraron usuarios con los filtros ingresados', '3')
        }
      });




    } else {
      this.modalSvc.openStatusMessage('Aceptar', 'Debe ingresar información a los filtros', '3')
      return
    }
  }

  async listarDocumentos() {
    this.loaderSvc.show();
    this.loaderSvc.text.set({ text: 'Cargando tipos de documento' });
    try {
      let response = await lastValueFrom(this.shadedSVC.documentsTypes());
      this.loaderSvc.hide();
      if (response.ok) {
        this.tiposDocumentos = response.data
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async consultAllUsers() {
    if(this.finishData){
      return
    }

    this.loaderSvc.show();
    this.loaderSvc.text.set({ text: 'Cargando usuarios' });
    this.loadingData = true;

    this.userSvc.getAllUsers(this.currentPage, this.finalPage).pipe(
      catchError((e: any) => {
        this.loaderSvc.hide();
        setTimeout(() => {
          this.loadingData = false;
        }, 100);
        return throwError(e);
      }),
      finalize(() => {
        this.loaderSvc.hide();
        setTimeout(() => {
          this.loadingData = false;
        }, 100);
      })
    ).subscribe((response: any) => {
      if (response.ok) {
        if (this.currentPage === 0) {
          let usuarios = response.data.map((user: any) => {
            user.tipoDocumento = this.tiposDocumentos.find((documento: any) => documento.idDocumentType == user.idIdentificationType).documentType
            if (user.photo) {
              user.image = `data:image/png;base64,${user.photo}`;
            }
            return user
          })
          this.listUsers = usuarios
          this.listUsersCopy = usuarios


          if (response.data?.length >= 30) {
            try {
              const lastPage = this.currentPage + 30
              this.currentPage = lastPage;
              this.finalPage = lastPage + 30

              if (this.currentPage == 0 && this.scrollContainer) {
                this.scrollContainer.nativeElement.scrollTop = 0;
              }
            } catch (error) { }
          } else {
            if (this.scrollContainer) this.scrollContainer.nativeElement.scrollTop = 0;
          }

          // this.pageSize = 30;
        } else {
          let usuarios = response.data.map((user: any) => {
            if( this.listUsers.find(u => u.identificationNumber === user.identificationNumber ) ){
            }else{
              user.tipoDocumento = this.tiposDocumentos.find((documento: any) => documento.idDocumentType == user.idIdentificationType).documentType
              if (user.photo) {
                user.image = `data:image/png;base64,${user.photo}`;
              }
              return user
            }
          }).filter((x:any) => x !== undefined);
          this.listUsers = this.listUsers.concat(usuarios);
          this.listUsersCopy = this.listUsersCopy.concat(usuarios);

          if (response.data?.length >= 30) {
              const lastPage = this.currentPage + 30
              this.currentPage = lastPage;
              this.finalPage = lastPage + 30
          }

        }


        if (response.data?.length < 30) {
          this.finishData = true;
        }



      }else{
        this.finishData = true;
      }
    });


  }

  openModalCredencial(template: TemplateRef<any>, email: string, idUser: number, titulo: string = '', mensaje: string = '') {
    this.correoUsuario = email;
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

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async x => {
      await this.enviarCredencialesEmail(idUser);
      dialogRef.close();
    });
  }

  async enviarCredencialesEmail(idUser: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Enviando credenciales' })
      let response = await lastValueFrom(this.userSvc.sendEmailCredentials(idUser));
      this.loaderSvc.hide()
      if (response.ok) {
        this.modalSvc.openStatusMessage('Aceptar', 'Credenciales enviadas correctamente', '1')
      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'Ocurrio un error al enviar las credenciales', '4')
      }


    } catch (error) {
      this.modalSvc.openStatusMessage('Aceptar', 'Ocurrio un error al enviar las credenciales', '4')
      this.loaderSvc.hide()

    }

  }

  async cambiarEstado(estado: any, idUser: number, usuario:User) {

    let userChangue: UserChangueSatus = {
      id: idUser,
      status: estado,
      idUserAction: this.shadedSVC.obtenerIdUserAction()
    }
    try {
      this.loaderSvc.show()
      let response = await lastValueFrom(this.userSvc.changueStatusUser(userChangue));
      this.loaderSvc.hide()
      if (response.ok) {
        const antes = JSON.parse(JSON.stringify(usuario));
        usuario.active = estado;


        this.trazabilidad({...antes,fullNameUserAction:this.nombreUsuario},{...usuario,fullNameUserAction:this.nombreUsuario},2,'Edición');
        this.modalSvc.openStatusMessage('Aceptar', 'Estado cambiado correctamente', '1')
      }
    } catch (error) {
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', 'Ocurrio un error al cambiar el estado, intente de nuevo', '4')

    }

  }

  limpiar() {
    this.formSearch.reset();
    this.listUsers = [];
    this.loadingData = false;
    this.finishData = false;
    this.currentPage = 0;
    this.finalPage = 30;
    this.consultAllUsers();
  }




}
