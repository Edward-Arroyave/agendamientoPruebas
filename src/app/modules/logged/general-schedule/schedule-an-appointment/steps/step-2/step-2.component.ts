import { Component, Input, OnInit, output, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ProcedenciasService } from '@app/services/administracion/procedencias/procedencias.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { PatientService } from '@app/services/pacientes/patient.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { IProcedencia } from '@app/shared/interfaces/procedencias/procedencias.model';
import { Sede } from '@app/shared/interfaces/sedes/sedes.model';
import { IPacienteHis } from '@app/shared/interfaces/usuarios/paciente-his.model';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { ModalService } from '../../../../../../services/modal/modal.service';
import { IGetHomologateEntity } from '@app/shared/interfaces/interoperability/dictorionary-model';

@Component({
  selector: 'app-step-2',
  standalone: true,
  imports: [
    BasicInputComponent,
    MatIcon,
  ],
  templateUrl: './step-2.component.html',
  styleUrl: './step-2.component.scss'
})
export class Step2Component implements OnInit {

  @Input() espaciosRemitidoFlag!:boolean;
  @Input() espaciosIdOriginEntity!:any;
  @Input() espaciosPlan!:boolean;

  @Input() formRemitido!: FormGroup;
  @Input() pacienteParticularFlag!: boolean;
  @Input() currentTabId!: number;
  @Input() tabs!: any[];
  @Input() formProcedimiento!: FormGroup;

  @Input() paciente!: IPacienteHis;
  @Input() particularContractCode!: string;

  verPacienteParticular: boolean = true;

  onTaps = output<any[]>();
  onCurrentTabId = output<number>();
  onParticularFlag = output<boolean>();
  onVerParticular = output<boolean>();
  onParticularCode = output<string>();

  cuidades: any[] = [];
  sedes: Sede[] = [];
  listaEntidades: IProcedencia[] = [];
  listPlan: any[] = [];

  maxDate = new Date();


  constructor(
    private loaderSvc: LoaderService,
    private procedenciasService: ProcedenciasService,
    private modalService:ModalService
  ) { }

  ngOnInit(): void {
    this.getProcedencias();
    this.formProcedimiento.reset({ search: "" });
  }

  scrollTop() {
    let div = document.getElementById('scrolllTop');
    if (div) div.scrollTop = 0;
  }

  validatorRequired(form: FormGroup, campo: string) {
    form.get(campo)?.setValidators([Validators.required]);
    form.get(campo)?.updateValueAndValidity();
  }

  validatorRemoved(form: FormGroup, campo: string) {
    form.get(campo)?.removeValidators([Validators.required]);
    form.get(campo)?.updateValueAndValidity();
    form.get(campo)?.reset();
  }


  validadoresDinamicos(x:number){
    const entidadSelected = this.listaEntidades.filter(y => y.idOriginEntity == x)[0];
    if (entidadSelected.medicalOrderDate) this.validatorRequired(this.formRemitido, 'dateOrder');
    if (entidadSelected.medicalOrder) this.validatorRequired(this.formRemitido, 'medicalOrder');

    if (entidadSelected.medicalHistory) this.validatorRequired(this.formRemitido, 'clinicHistory');
    if (entidadSelected.medicalHistoryDate) this.validatorRequired(this.formRemitido, 'dateHistory');

    if (entidadSelected.authorizationDate) this.validatorRequired(this.formRemitido, 'dateAuthorization');
    if (entidadSelected.medicalAuthorization) this.validatorRequired(this.formRemitido, 'medicalAuthorization');

    // Remover validadores
    if (!entidadSelected.medicalOrderDate) this.validatorRemoved(this.formRemitido, 'dateOrder');
    if (!entidadSelected.medicalOrder) this.validatorRemoved(this.formRemitido, 'medicalOrder');

    if (!entidadSelected.medicalHistory) this.validatorRemoved(this.formRemitido, 'clinicHistory');
    if (!entidadSelected.medicalHistoryDate) this.validatorRemoved(this.formRemitido, 'dateHistory');

    if (!entidadSelected.authorizationDate) this.validatorRemoved(this.formRemitido, 'dateAuthorization');
    if (!entidadSelected.medicalAuthorization) this.validatorRemoved(this.formRemitido, 'medicalAuthorization');
  }

  async getProcedencias() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando tipos de documento' })
      const data =
      {
        origin: "",
        entity: "",
        status: true
      }
      let documents = await lastValueFrom(this.procedenciasService.getListEntities(data));
      if (documents.ok) {
        this.listaEntidades = documents.data;
        this.listaEntidades = this.listaEntidades.map(x => {
          x.entity = x.origin + ' - ' + x.entity;
          return x;
        })

        if(this.espaciosRemitidoFlag){
          this.formRemitido.get('idOriginEntity')?.setValue(this.espaciosIdOriginEntity);
          this.formRemitido.get('plan')?.setValue(this.espaciosPlan);
          this.validadoresDinamicos(this.espaciosIdOriginEntity);
        }

        this.formRemitido.get('idOriginEntity')?.valueChanges.subscribe(async x => {
          if (x) {
            //Cargar planes segun la entidad
            await this.getPlanByEntity(x);
            this.validadoresDinamicos(x);
          }
        });
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }

  }


  async getPlanByEntity(entity: number) {
    try {
      const dataHomologate:IGetHomologateEntity = {
        code:entity.toString(),
        dictionaryName:'Tercero',
        idIntegration:1,
        searchOwn:false
      }
      const responseHomologate =  await lastValueFrom(this.procedenciasService.getHomologationEntity(dataHomologate));
      if(responseHomologate.ok){
        this.formRemitido.get('plan')?.reset();
        this.loaderSvc.show()
        this.loaderSvc.text.set({ text: 'Cargando planes de la entidad' })
        let documents = await lastValueFrom(this.procedenciasService.getListThirtContracts(responseHomologate.data));
        documents.ok? this.listPlan = documents.data: this.modalService.openStatusMessage("Cancelar","No se encontraron contratos relacionados a la entidad","4");
      }else{
        this.modalService.openStatusMessage('Cancelar','No se encontró homologaciones relacionadas a la entidad','4');
        this.listPlan = [];
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.modalService.openStatusMessage('Cancelar','No se encontraron contratos relacionados a la entidad','4');
      this.listPlan = [];
      this.loaderSvc.hide();
    }
  }

  pacienteParticular(flag: boolean) {
    // this.pacienteParticularFlag = flag;
    this.tabs[this.currentTabId - 1].completed = true;
    this.currentTabId += 1;

    this.onTaps.emit(this.tabs)
    this.onCurrentTabId.emit(this.currentTabId);
    this.onParticularFlag.emit(flag);

    this.formRemitido.reset();
    setTimeout(() => {
      this.scrollTop()
    }, 200);

  }



}
