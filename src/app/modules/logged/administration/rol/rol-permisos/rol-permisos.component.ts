import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { MatDialog } from '@angular/material/dialog';
import { TablaPermisosComponent } from '../../../../../shared/tabla/tabla-permisos/tabla-permisos.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RolesService } from '../../../../../services/roles/roles.service';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { StatusRol } from '../../../../../shared/interfaces/roles/roles.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-rol-permisos',
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
  templateUrl: './rol-permisos.component.html',
  styleUrl: './rol-permisos.component.scss'
})
export class RolPermisosComponent {
  formSearch = this.fb.group({
    search: [''],
  })
  listUsers: any[] = [];
  listUsersCopy: any[] = [];
  tiposDocumentos: any[] = [];
  headers = ['Módulo principal', 'Crear', 'Editar', 'Ver', 'Eliminar']
  permisos: any[] = [];
  permisosCopy: any[] = [];

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  idRole: number = 0;
  permisosDelModulo: any

  constructor(
    private fb: FormBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private loaderSvc: LoaderService,
    private modalSvc: ModalService,
    private shadedSVC: SharedService,
    private rolesSvc: RolesService,
    private activateR: ActivatedRoute,
    private tzs: TrazabilidadService,
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Roles y permisos')

    this.activateR.params.subscribe(params => {

      let idRole = params['idRol'];
      if (idRole) {
        this.idRole = Number(idRole);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.filterSearch()
    await this.cargarPermisos();
  }

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  trazabilidad(antes:StatusRol,despues:StatusRol | null,idMovimiento:number,movimiento:string){
    const dataTrazabilidad:dataTrazabilidad= {
        datos_actuales: antes,
        datos_actualizados: despues,
        idModulo: 7,
        idMovimiento,
        modulo: "Administración",
        movimiento,
        subModulo: "Roles y permisos"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

  async cargarPermisos() {
    try {

      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando rol' });
      this.formSearch.get('search')?.setValue('')
      let permisos = await lastValueFrom(this.rolesSvc.getPermissesByRol(this.idRole));

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
    this.router.navigate(['/inicio/administracion/roles-permisos'])
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
    let he = container - header - search - 120 ;
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




  async changePrincipalMenu(data: any) {

    if (!this.permisosDelModulo.Editar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.cargarPermisos()
      return
    }

    let objeto: StatusRol = {
      idRole_Menu: data[0].idRole_Menu,
      idRol: this.idRole,
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
      let response = await lastValueFrom(this.rolesSvc.changeStatusPermissesRol(objeto));
      this.loaderSvc.hide()
      if (response.ok) {
        this.trazabilidad(antes,objeto,2,'Edición');
        if (response.data) {
          this.actualizarEstadoPadre(objeto.idMenu, data[1], data[2], response.data[0])
        } else {
          this.actualizarEstadoPadre(objeto.idMenu, data[1], data[2])
        }

      } else {
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
      this.cargarPermisos()
      return
    }

    let objeto: StatusRol = {
      idRole_Menu: data[0].idRole_Menu,
      idRol: this.idRole,
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
      let response = await this.rolesSvc.changeStatusPermissesRol(objeto).toPromise();
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


  actualizarEstadoPadre(idMenu: number, estado: number, item: string, idRole_Menu?: number) {

    let itemPadre = this.permisos.find(menu => menu.idMenu == idMenu);
    itemPadre[item] = estado;
    if (idRole_Menu) {
      itemPadre.idRole_Menu = idRole_Menu
    }
  }


  actualizarEstadoHijo(idMenu: number, estado: number, item: string, idRole_Menu?: number) {

    let hijo: any;

    for (const padre of this.permisos) {
      let encontrarHijo = padre.children.find((h: any) => h.idMenu == idMenu);
      if (encontrarHijo) {
        hijo = encontrarHijo;
        hijo[item] = estado;
        if (idRole_Menu) {
          hijo.idRole_Menu = idRole_Menu
        }
        break
      }
    }
  }

}





