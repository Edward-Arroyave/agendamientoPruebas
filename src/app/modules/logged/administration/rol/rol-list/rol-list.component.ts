import { Rol, RolStatus } from './../../../../../shared/interfaces/roles/roles.model';
import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { TablaComunComponent } from '../../../../../shared/tabla/tabla-comun/tabla-comun.component';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { MatDialog } from '@angular/material/dialog';
import { RolesService } from '../../../../../services/roles/roles.service';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-rol-list',
  standalone: true,
imports: [
  TablaComunComponent,
  MatIcon,
  ReactiveFormsModule,
  BasicInputComponent,
  RouterLink
],
  templateUrl: './rol-list.component.html',
  styleUrl: './rol-list.component.scss'
})
export class RolListComponent {

  cabeceros: string[] = ['Nombre del rol', 'Tipo de rol', 'Permisos', 'Estado', 'Editar', 'Eliminar'];
  roles: any[] = [];
  rolesCopy: any[] = [];

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  formSearch = this.fb.group({
    search: [''],
  })

  permisosDelModulo: any

  paginadorNumber : number = 0;
  constructor(
    private loaderSvc: LoaderService,
    private modalService: ModalService,
    private fb: FormBuilder,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private shadedSVC: SharedService,
    private router: Router,
    private dialog: MatDialog,
    private rolSvc: RolesService,
    private tzs: TrazabilidadService
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Roles y permisos');
  }

  async ngOnInit(): Promise<void> {
    this.filterSearch();
    await this.getRolList();
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  ngAfterViewInit() {
    this.ajustarAlto();
  }

  trazabilidad(antes:Rol,despues:Rol | null,idMovimiento:number,movimiento:string){
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


  filterSearch() {
    this.formSearch.get('search')?.valueChanges.subscribe(e => {
      let data = this.rolesCopy
      if (e) {
        let word = e.toLowerCase().trim();
        data = data.filter(rol => rol.roleName.toLowerCase().includes(word.trim()) || rol.typeRoleName.toLowerCase().includes(word.trim()));
        if (data.length) {
          this.mapearTabla(data);
        }
      } else {
        this.mapearTabla(this.rolesCopy);
      }
    })
  }

  private ajustarAlto() {

    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const contenedor = this.elRef.nativeElement.querySelector('.titulo').offsetHeight;
    const form = this.elRef.nativeElement.querySelector('.contenedor1').offsetHeight;

    let he = container - contenedor - form - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.table-cont'), 'height', `${he}px`);

    if(he > 50){
      let paginador = he / 30;
      this.paginadorNumber = Math.floor(paginador / 2);
    }else{
      this.paginadorNumber  = 1
    }

  }


  mapearTabla(roles: any[]) {

    this.roles = roles.map((rol: any) => ({
      item1: rol.roleName,
      item2: rol.typeRoleName,
      item3: rol, /*Estado*/
      item4: rol, /*Editar*/
      item5: rol  /*Eliminar*/
    }));
  }

  async getRolList() {

    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando roles' })
      let items = await lastValueFrom(this.rolSvc.getAllRoles());
      if (items.data) {

        this.formSearch.get('search')?.setValue('')
        this.rolesCopy = items.data
        this.mapearTabla(items.data);
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }



  editRol(event: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')

      return
    }
    this.router.navigate(['/inicio/administracion/roles-permisos/form/', event.idRole]);
  }
  abrirPermisos(event: any) {
    this.router.navigate(['/inicio/administracion/roles-permisos/permisos/', event.item3.idRole]);
  }

  async eliminarRol(event: any) {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '4')

      return
    }
    let idRole = event.idRole
    if (idRole) {
      try {
        this.loaderSvc.show();
        let r = await lastValueFrom(this.rolSvc.deleteRol(idRole));
        this.loaderSvc.hide();
        if (r.ok) {
          this.modalService.openStatusMessage('Aceptar', `Rol eliminado correctamente`, "1");
          this.trazabilidad(event,null,3,'Eliminación');
          await this.getRolList();
        } else {
          this.modalService.openStatusMessage('Aceptar', `No se puede eliminar el rol`, "4", 'hay usuarios que tienen el rol asignado')
        }
      } catch (error) {
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al eliminar el rol, intente de nuevo`, "4")
        this.loaderSvc.hide();

      }
    }
  }
  async cambiarEstado(event: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      this.getRolList()
      return
    }


    let obj: RolStatus = {
      id: event[0].item3.idRole,
      status: event[1],
      idUserAction: this.shadedSVC.obtenerIdUserAction()
    }
    // Para la trazabilidad
    let antes =  JSON.parse(JSON.stringify(event[0].item3));
    antes.active = !event[1];
    let despues :Rol = JSON.parse(JSON.stringify(event[0].item3));
    despues.active = event[1];
    despues.fullNameUserAction = this.nombreUsuario;
    despues.idUserAction = this.idUser;



    try {
      this.loaderSvc.show();
      let r = await lastValueFrom(this.rolSvc.statusRolChange(obj));
      this.loaderSvc.hide();
      if (r.ok) {
        this.trazabilidad(antes,despues,2,'Edición');
        this.modalService.openStatusMessage('Aceptar', `Rol ${obj.status ? 'activado' : 'desactivado'} correctamente`, "1")
        //Actualizar el estado directamente en el arreglo:
        let status = this.roles.find(s => s.item3.idRole == event[0].item3.idRole);
        if(status) status.item3.active = event[1];
        this.getRolList();
      } else {
        this.getRolList();
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${obj.status ? 'activar' : 'desactivar'} el rol, intente de nuevo, ${r.message}`, "4")
      }
    } catch (error) {
      this.getRolList();
      this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${obj.status ? 'activar' : 'desactivar'} el rol, intente de nuevo`, "4")
      this.loaderSvc.hide();

    }
  }
}
