import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../../../../services/usuarios/users.service';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { TablaPermisosComponent } from "../../../../../shared/tabla/tabla-permisos/tabla-permisos.component";
import { StatusUserPermises } from '../../../../../shared/interfaces/usuarios/users.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { lastValueFrom } from 'rxjs';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-permisos-usuario',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    BasicInputComponent,
    TablaPermisosComponent
  ],
  templateUrl: './permisos-usuario.component.html',
  styleUrl: './permisos-usuario.component.scss'
})
export class PermisosUsuarioComponent {

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  formSearch = this.fb.group({
    search: [''],
  })
  listUsers: any[] = [];
  listUsersCopy: any[] = [];
  tiposDocumentos: any[] = [];
  headers = ['Módulo principal', 'Crear', 'Editar', 'Ver', 'Eliminar']
  permisos: any[] = [];
  permisosCopy: any[] = [];


  correoUsuario: string = 'administrador@ithealth.co'

  idUser: number = 0;

  permisosDelModulo: any;

  constructor(
    private fb: FormBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private loaderSvc: LoaderService,
    private modalSvc: ModalService,
    private shadedSVC: SharedService,
    private userSvc: UsersService,
    private activateR: ActivatedRoute,
    private tzs: TrazabilidadService,
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Usuarios')
    this.activateR.params.subscribe(params => {

      let idUser = params['idUser'];
      if (idUser) {
        this.idUser = Number(idUser);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarPermisos();
    this.filterSearch()
  }

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  trazabilidad(antes:StatusUserPermises,despues:StatusUserPermises | null,idMovimiento:number,movimiento:string){
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

  async cargarPermisos() {
    try {

      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando permisos' });
      let permisos = await lastValueFrom(this.userSvc.getPermissesByUser(this.idUser));
      this.loaderSvc.hide();
      if (permisos.data) {
        this.permisos = permisos.data;
        this.permisosCopy = permisos.data;
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  cancelar() {
    this.router.navigate(['/inicio/administracion/usuarios'])
  }

  asignar() {
    this.modalSvc.openStatusMessage('Aceptar', '¡Permisos asignados al usuario correctamente!', '1')
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }


  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.title').offsetHeight;
    const search = this.elRef.nativeElement.querySelector('.form-search').offsetHeight;
    let he = container - header - search - 120;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.tabla-permisos'), 'height', `${he}px`);
  }


  filterSearch() {
    this.formSearch.get('search')?.valueChanges.subscribe(e => {
      if (e) {
        let word = e.toLowerCase().trim();
        this.permisos = this.permisosCopy.filter(p => {
          const nameMatches = p.name.toLowerCase().includes(word);
          const childrenMatch = p.children.some((phijo: any) => phijo.name.toLowerCase().includes(word));
          return nameMatches || childrenMatch;
        });
      } else {
        this.permisos = this.permisosCopy;
      }
    });
  }

  recargarPermisos() {
    this.formSearch.get('search')?.setValue('')
    this.cargarPermisos()
  }


  async changePrincipalMenu(data: any) {

    if (!this.permisosDelModulo.Editar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.recargarPermisos()
      return
    }


    let objeto: StatusUserPermises = {
      idUser_Menu : data[0].idUser_Menu,
      idUser: this.idUser,
      idMenu: data[0].idMenu,
      toRead: data[0].ver,
      toCreate: data[0].crear,
      toUpdate: data[0].editar,
      toDelete: data[0].eliminar,
      idUserAction: this.shadedSVC.obtenerIdUserAction(),
      name: data[0].name,
      fullNameUserAction: this.nombreUsuario,
    }

    // para la trazabilidad
    const antes = JSON.parse(JSON.stringify(objeto));

    switch (data[2]) {
      case 'crear':
        objeto.toCreate = data[1]

        break;
      case 'editar':
        objeto.toUpdate = data[1]

        break;
      case 'ver':
        objeto.toRead = data[1]

        break;
      case 'eliminar':
        objeto.toDelete = data[1]

        break;

      default:
        break;
    }
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Guardando permiso' })
      let response = await this.userSvc.UpdatePermisesUser(objeto).toPromise();
      this.loaderSvc.hide()
      if (response.ok) {
        this.trazabilidad(antes,objeto,2,'Edición');
        if (response.data) {
          this.actualizarEstadoPadre(objeto.idMenu, data[1], data[2], response.data[0])

        } else {
          this.actualizarEstadoPadre(objeto.idMenu, data[1], data[2])

        }

      }else {
        this.modalSvc.openStatusMessage('Aceptar', '¡Ocurrio un error al asignar los permisos!', '4', 'intente de nuevo')
      }

    } catch (error) {
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', '¡Ocurrio un error al asignar los permisos!', '4', 'intente de nuevo')
    }


  }
  async changeChildMenu(data: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.recargarPermisos()
      return
    }

    let objeto: StatusUserPermises = {
      idUser_Menu : data[0].idUser_Menu,
      idUser: this.idUser,
      idMenu: data[0].idMenu,
      toRead: data[0].ver,
      toCreate: data[0].crear,
      toUpdate: data[0].editar,
      toDelete: data[0].eliminar,
      idUserAction: this.shadedSVC.obtenerIdUserAction(),
      name: data[0].name,
      fullNameUserAction: this.nombreUsuario,
    }
    // para la trazabilidad
    const antes = JSON.parse(JSON.stringify(objeto));

    switch (data[2]) {
      case 'crear':
        objeto.toCreate = data[1]
        break;
      case 'editar':
        objeto.toUpdate = data[1]
        break;
      case 'ver':
        objeto.toRead = data[1]
        break;
      case 'eliminar':
        objeto.toDelete = data[1]
        break;

      default:
        break;
    }
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Guardando permiso' })
      let response = await lastValueFrom(this.userSvc.UpdatePermisesUser(objeto));

      this.loaderSvc.hide()
      if (response.ok) {
        this.trazabilidad(antes,objeto,2,'Edición');
        if (response.data) {
          this.actualizarEstadoHijo(objeto.idMenu, data[1], data[2], response.data[0])

        } else {
          this.actualizarEstadoHijo(objeto.idMenu, data[1], data[2])

        }
      } else {
        this.modalSvc.openStatusMessage('Aceptar', '¡Ocurrio un error al asignar los permisos!', '4', 'intente de nuevo')
      }

    } catch (error) {
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', '¡Ocurrio un error al asignar los permisos!', '4', 'intente de nuevo')
    }
  }


  cambiarPermisosHijos(idMenu: number, estado: number, item: string) {

    let hijos = this.permisos.find(menu => menu.idMenu == idMenu);
    if (hijos) {
      for (const hijo of hijos.children) {
        hijo[item] = estado;
      }
    }

  }
  actualizarEstadoPadre(idMenu: number, estado: number, item: string, idUser_Menu?: number) {

    let itemPadre = this.permisos.find(menu => menu.idMenu == idMenu);
    itemPadre[item] = estado;
    if (idUser_Menu) {
      itemPadre.idUser_Menu = idUser_Menu
    }
  }

  actualizarEstadoHijo(idMenu: number, estado: number, item: string, idUser_Menu?: number) {

    let hijo: any;

    for (const padre of this.permisos) {
      let encontrarHijo = padre.children.find((h: any) => h.idMenu == idMenu);
      if (encontrarHijo) {
        hijo = encontrarHijo;
        hijo[item] = estado;
        if (idUser_Menu) {
          hijo.idUser_Menu = idUser_Menu
        }
        break
      }
    }
  }

}

