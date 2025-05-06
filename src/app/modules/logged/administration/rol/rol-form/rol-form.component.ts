import { Component, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { RolesService } from '../../../../../services/roles/roles.service';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { Rol } from '../../../../../shared/interfaces/roles/roles.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { lastValueFrom } from 'rxjs';


@Component({
  selector: 'app-rol-form',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTooltipModule,
    BasicInputComponent
  ],
  templateUrl: './rol-form.component.html',
  styleUrl: './rol-form.component.scss'
})
export class RolFormComponent {

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  formulario = this.fb.group({
    roleName: ['', [Validators.required]],
    idTypeRole: ['', [Validators.required]],
  },
    //  { validators: this.validarQueSeanIguales() }
  );


  tiposDeRol: any[] = [];

  idRole: number = 0;
  isEdit: boolean = false;
  rol: any = {}


  permisosDelModulo: any;
  constructor(
      private fb: FormBuilder,
      private router: Router,
      private shadedSVC: SharedService,
      private loaderSvc: LoaderService,
      private rolesSvc: RolesService,
      private loaderService: LoaderService,
      private modalSvc: ModalService,
      private activateR: ActivatedRoute,
      private tzs: TrazabilidadService,
    ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Roles y permisos')
    this.activateR.params.subscribe(params => {

      let idRole = params['idRol'];
      if (idRole) {
        this.idRole = Number(idRole);
        this.isEdit = true;
        if(!this.permisosDelModulo.Editar){
          this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
          this.cancelar()
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.listaTiposRol();
    await this.getRolById();
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

  get fv() {
    return this.formulario.value
  }
  get fc() {
    return this.formulario.controls
  }




  cancelar() {
    this.router.navigate(['/inicio/administracion/roles-permisos'])
  }

  async listaTiposRol() {
    try {
      this.loaderSvc.show();
      let items = await this.rolesSvc.rolTypesList().toPromise();
      this.loaderSvc.hide();
      if (items.data) {
        this.tiposDeRol = items.data;
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  async getRolById() {
    if (!this.isEdit) {
      return
    }
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando rol' });
      let rol = await lastValueFrom(this.rolesSvc.getRolById(this.idRole));
      this.loaderSvc.hide();
      if (rol.data) {
        this.rol = rol.data[0];
        this.fc.idTypeRole.setValue(this.rol.idTypeRole)
        this.fc.roleName.setValue(this.rol.roleName)
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  async crearRol() {

    if (this.formulario.valid) {

      let rol: Rol = {
        idRole: this.isEdit ? this.idRole : 0,
        roleName: String(this.fv.roleName),
        idUserAction: this.shadedSVC.obtenerIdUserAction(),
        fullNameUserAction: this.nombreUsuario,
        idTypeRole: Number(this.fv.idTypeRole),
        typeRoleName:this.tiposDeRol.filter(x => x.IdTypeRole === this.fv.idTypeRole)[0].TypeRoleName,
        active: true,

      }

      try {
        this.loaderSvc.show();
        let r = await lastValueFrom(this.rolesSvc.createUpdateRol(rol));
        this.loaderSvc.hide();
        if (r) {
          this.modalSvc.openStatusMessage('Aceptar', `Rol ${this.isEdit ? 'actualizado' : 'creado'} en el sistema correctamente`, "1")
          this.isEdit ? this.trazabilidad({...this.rol, fullNameUserAction:this.nombreUsuario},rol,2,'Edición'):this.trazabilidad(rol,null,1,'Creación');
          this.cancelar();
        }
      } catch (error:any) {
        if(String(error.error).includes('UNIQUE KEY')){
          this.modalSvc.openStatusMessage('Aceptar', `Ya existe una rol con el mismo nombre`, "4")
        }else{
        this.modalSvc.openStatusMessage('Aceptar', `Ocurrio un error al ${this.isEdit ? 'editar' : 'crear'} el rol, intente de nuevo`, "4")
        }
        this.loaderSvc.hide();

      }

    } else {
      this.formulario.markAllAsTouched();
    }

  }
}

