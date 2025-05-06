import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BasicInputComponent } from '../../../../../shared/inputs/basic-input/basic-input.component';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from '../../../../../services/loader/loader.service';
import { ModalService } from '../../../../../services/modal/modal.service';
import { SedesService } from '../../../../../services/sedes/sedes.service';
import { SharedService } from '../../../../../services/servicios-compartidos/shared.service';
import { Sede } from '../../../../../shared/interfaces/sedes/sedes.model';
import { JsonPipe } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';

@Component({
  selector: 'app-sedes-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, BasicInputComponent],
  templateUrl: './sedes-form.component.html',
  styleUrl: './sedes-form.component.scss'
})
export class SedesFormComponent {



  formulario = this.fb.group({
    attentionCenterCode: ['', [Validators.required]],
    attentionCenterName: ['', [Validators.required]],
    idCountry: ['', [Validators.required]],
    idDepartment: ['', [Validators.required]],
    idCity: ['', [Validators.required]],
    telephoneNumber: ['', [Validators.required]],
    address: ['', [Validators.required]],
    urlLocation: [''],

  },
    //  { validators: this.validarQueSeanIguales() }
  );


  departamentos: any[] = [];
  cuidades: any[] = [];
  paises: any[] = [];

  infoGeografica:any[] = [] ;

  idSede: number = 0;
  isEdit: boolean = false;
  sede: any = {};
  sedeTraza!: Sede;

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();
  permisosDelModulo: any;

  constructor( private tzs: TrazabilidadService,private shadedSVC: SharedService, private fb: FormBuilder, private router: Router, private loaderSvc: LoaderService,
    private sedesSvc: SedesService, private modalService: ModalService, private ActivRoute: ActivatedRoute
  ) {

    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Roles y permisos')
    this.ActivRoute.params.subscribe(params => {

      let idSede = params['idSede'];
      if (idSede) {
        this.idSede = Number(idSede);
        this.isEdit = true;
        if (!this.permisosDelModulo.Editar) {
          this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
          this.cancelar()
        }
      }
    });

  }

  async ngOnInit(): Promise<void> {
    this.filtrosPaises();
    await this.getCountries();
    await this.getSedeById();
  }

  get fv() {
    return this.formulario.value
  }
  get fc() {
    return this.formulario.controls
  }

  async trazabilidad(antes:Sede,despues:Sede | null,idMovimiento:number,movimiento:string){
    const dataTrazabilidad:dataTrazabilidad= {
        datos_actuales: antes,
        datos_actualizados: despues,
        idModulo: 7,
        idMovimiento,
        modulo: "Administración",
        movimiento,
        subModulo: "Sedes"
    }
    try {
      await this.tzs.postTrazabilidad(dataTrazabilidad);
    } catch (error) {
      console.error(error)
    }
  }

  async getSedeById() {
    if (!this.isEdit) {
      return
    }
    try {

      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando sede' });
      let sede = await lastValueFrom(this.sedesSvc.getSedeById(this.idSede));
      this.loaderSvc.hide();
      if (sede.data) {
        this.sede = sede.data[0];
        this.sedeTraza = JSON.parse(JSON.stringify(sede.data[0]));
        this.fc.attentionCenterCode.setValue(this.sede.attentionCenterCode)
        this.fc.attentionCenterName.setValue(this.sede.attentionCenterName)
        this.fc.idCountry.setValue(this.sede.idCountry)

        this.fc.address.setValue(this.sede.address)
        this.fc.urlLocation.setValue(this.sede.urlLocation)
        this.fc.telephoneNumber.setValue(this.sede.telephoneNumber)

      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  cancelar() {
    this.router.navigate(['/inicio/administracion/sedes'])
  }
  async crearSede() {

    if (this.formulario.valid) {

      let sede: Sede = {
        idAttentionCenter: this.isEdit ? this.idSede : 0,
        attentionCenterCode: String(this.fv.attentionCenterCode),
        attentionCenterName: String(this.fv.attentionCenterName),
        idCountry: Number(this.fv.idCountry),
        idDepartment: Number(this.fv.idDepartment),
        idCity: Number(this.fv.idCity),
        telephoneNumber: String(this.fv.telephoneNumber),
        address: String(this.fv.address),
        urlLocation: String(this.fv.urlLocation),
        active: true,
        idUserAction: this.shadedSVC.obtenerIdUserAction(),
        fullNameUserAction : this.nombreUsuario
      }

      let antes;
      let despues;
      if(!this.isEdit){
        const sedeNueva = {
          ...sede,
          countryName:this.paises.filter(x => x.idCountry === sede.idCountry)[0].country,
          departmentName:this.departamentos.filter(x => x.idDepartment === sede.idDepartment)[0].department,
          cityName:this.cuidades.filter(x => x.idCity === sede.idCity)[0].city
        };
        antes = JSON.parse(JSON.stringify(sedeNueva));
      }else{
        antes = JSON.parse(JSON.stringify(this.sedeTraza));
        const actualizarSede = {
          ...sede,
          countryName:this.sedeTraza.countryName,
          departmentName:this.sedeTraza.departmentName,
          cityName:this.sedeTraza.cityName
        };
        despues = JSON.parse(JSON.stringify(actualizarSede));
        despues.fullNameUserAction = this.nombreUsuario;
        despues.idUserAction = this.idUser;
      }
      try {
        this.loaderSvc.show();
        let r = await lastValueFrom(this.sedesSvc.createUpdateSede(sede))
        this.loaderSvc.hide();
        if (r.ok) {
          !this.isEdit ?this.trazabilidad(antes,null,1,'Creación'):this.trazabilidad(antes,despues,2,'Edición');
          this.modalService.openStatusMessage('Aceptar', `Sede ${this.isEdit ? 'actualizada' : 'creada'} en el sistema correctamente`, "1")
          this.cancelar();
        } else {
          this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${this.isEdit ? 'editar' : 'crear'} la sede, intente de nuevo`, "4")
        }
      } catch (error:any) {
        if(String(error.error).includes('UNIQUE KEY')){
          this.modalService.openStatusMessage('Aceptar', `Ya existe una sede con el mismo código`, "4")
        }else{
          this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al ${this.isEdit ? 'editar' : 'crear'} la sede, intente de nuevo`, "4")
        }


        this.loaderSvc.hide();

      }

    } else {
      this.formulario.markAllAsTouched();
    }
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
  async getDepartaments(pais: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando departamentos' })
      this.fc.idDepartment.setValue('')
      let items = await lastValueFrom(this.shadedSVC.getDepartaments(pais));
      if (items.data) {
        this.departamentos = items.data;
        setTimeout(() => {
          if (this.sede.idDepartment) {
            this.fc.idDepartment.setValue(this.sede.idDepartment)
            this.sede.idDepartment = null
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
          if (this.sede.idCity) {
            this.fc.idCity.setValue(this.sede.idCity)
            this.sede.idCity = null
          }
        }, 100);
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }
}
