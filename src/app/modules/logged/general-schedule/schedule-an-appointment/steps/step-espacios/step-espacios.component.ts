import { JsonPipe } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit, output, TemplateRef, OnChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'; import { MatDialog } from '@angular/material/dialog';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { LoaderService } from '@app/services/loader/loader.service';
import { PatientService } from '@app/services/pacientes/patient.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { ModalData } from '@app/shared/globales/Modaldata';
;
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ICalculoCreatinina, IDataGeneral, IReservar, ListDisponibilityAppointment } from '@app/shared/interfaces/agendar-cita/agendar-cita.interface';
import { IPacienteHis } from '@app/shared/interfaces/usuarios/paciente-his.model';
import { User } from '@app/shared/interfaces/usuarios/users.model';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-step-espacios',
  standalone: true,
  imports: [
    BasicInputComponent, MatRadioButton, ReactiveFormsModule,  FormsModule,  MatRadioGroup
  ],
  templateUrl: './step-espacios.component.html',
  styleUrl: './step-espacios.component.scss'
})
export class StepEspaciosComponent implements OnInit, AfterViewInit {

  @Input() formRemitido!: FormGroup;
  @Input() formulario!: FormGroup;
  @Input() listaAgendaSeleccionada: ListDisponibilityAppointment[] = [];

  @Input() paciente!: IPacienteHis;
  @Input() pacienteParticularFlag!: boolean;
  @Input() idAgenda!: number;
  @Input() calculoCreatinina!: ICalculoCreatinina;

  @Input() dataGeneral !: IDataGeneral;

  @Input() formCompanion!: FormGroup;
  @Input() formButtonCompanion!: FormControl;



  listaRequerimientos: any[] = [];
  listaProcedimientos: any[] = [];

  onCrearReserva = output<IReservar>();
  onInfoPaso_4 = output<any>();
  onObservations = output<any>();
  onProcedimientos = output<any>();
  maxDate = new Date();

  relationship: any[] = [];
  listaDocumentos: any[] = [];





  constructor(private fb: FormBuilder, private patientSvc: PatientService,
    private loaderSvc: LoaderService, private sharedService: SharedService, private dialog: MatDialog

  ) {

  }
  ngAfterViewInit(): void {
    this.creatininaRequired();
  }

  ngOnInit(): void {
    // this.creatininaRequired();
  }

  creatininaRequired() {
    this.formulario.get('desiredDate')?.setValue(this.listaAgendaSeleccionada[0].desiredDate)
    if (this.calculoCreatinina?.specialConditionName == "Contrastado") {
      this.validatorRequired(this.formulario, 'creatinineResultDate');
      this.validatorRequired(this.formulario, 'creatinineResult');
    } else {
      this.validatorRemoved(this.formulario, 'creatinineResultDate');
      this.validatorRemoved(this.formulario, 'creatinineResult');
    }
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

  async getRelationships() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando tipos de parentezco' })

      let relation = await lastValueFrom(this.patientSvc.getRelationship());
      if (relation.ok && relation.data.length) {
        this.relationship = relation.data;
      } else {
        this.relationship = [];
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }
  }


  async getDocuments() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando tipos de documento...' })
      let documents = await lastValueFrom(this.sharedService.documentsTypes());
      if (documents.data) {
        this.listaDocumentos = documents.data;
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }

  }



  async openModalCompanion(template: TemplateRef<any> | undefined, $event: any, titulo: string = '', mensaje: string = '') {

    if ($event.value) {
      await this.getRelationships();
      await this.getDocuments();

      const destroy$: Subject<boolean> = new Subject<boolean>();
      /* Variables  recibidas por el modal */
      const data: ModalData = {
        content: template,
        btn: 'Aceptar',
        btn2: 'Cancelar',
        footer: true,
        title: titulo,
        type: '',
        message: '',
        image: ''
      };
      const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '80em', data, disableClose: true });


      dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(_x => {

        if (this.formCompanion.valid) {
          dialogRef.close();
        } else {
          this.formCompanion.markAllAsTouched();
        }

      });
      dialogRef.componentInstance.secondaryEvent?.pipe(takeUntil(destroy$)).subscribe(_x => {
        dialogRef.close();
        this.formCompanion.reset();
        this.formButtonCompanion.setValue(false);
      });

    } else {
      this.formCompanion.reset();
      this.formButtonCompanion.setValue(false);
    }



  }
}
