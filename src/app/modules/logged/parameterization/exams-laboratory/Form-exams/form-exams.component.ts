import { lastValueFrom } from 'rxjs';
import { NgIf, NgFor } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamsLaboratoryService } from '@app/services/exams-laboratory/exams-laboratory.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { UsersService } from '@app/services/usuarios/users.service';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '@app/shared/inputs/toggle/toggle.component';
import { ExamLaboratory } from '@app/shared/interfaces/exams-laboratory/exams-laboratory.model';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-form-exams',
  standalone: true,
  imports: [BasicInputComponent, MatTabsModule,
    MatTooltipModule, MatCheckbox, MatInputModule,
    FormsModule, MatIconModule, ReactiveFormsModule,
    MatFormFieldModule, ToggleComponent, NgIf, NgFor],
  templateUrl: './form-exams.component.html',
  styleUrl: './form-exams.component.scss'
})
export class FormExamsComponent {

  idExam: number | undefined = undefined;
  listExamsCups: any[] = [];
  permisosDelModulo: any
  selectedTabIndex: number = 0;

  formExam = this.fb.group({
    cups: ['', [Validators.required]],
    examName: ['', [Validators.required]],
    biologicalSex: ['', [Validators.required]],
    preconditions: [''],
    indications: [''],
    listRequeriments: this.fb.array([]),
  });

  currentExam: any = undefined;

  eliminados: any[] = [];

  biologicalSex: any[] = [{ id: 'F', name: 'F (Femenino)' }, { id: 'M', name: 'M (Masculino)' }, { id: 'F', name: 'A (Ambos sexos)' },];

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  constructor(
    private actRoute: ActivatedRoute,
    private elRef: ElementRef, private renderer: Renderer2,
    private router: Router,
    private shadedSVC: SharedService,
    private loaderSvc: LoaderService,
    private userSvc: UsersService,
    private modalService: ModalService,
    private fb: FormBuilder,
    private tzs: TrazabilidadService,
    private examsSvc: ExamsLaboratoryService,
    private modalSvc: ModalService
  ) {
    this.actRoute.params.subscribe(params => {
      this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Exámenes de laboratorio')
      let idExam = params['idExam'];
      if (idExam) {
        this.idExam = Number(idExam);
        if (!this.permisosDelModulo.Editar) {
          this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
          this.cancel()
        }
      }
    });
  }


  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto();
    }, 100);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.ajustarAlto();
    });
  }


  get fv() {
    return this.formExam.value;
  }
  get fc() {
    return this.formExam.controls;
  }


  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.titulo').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.form'), 'height', `${he}px`);
  }
  async ngOnInit() {
    await this.getCups();
    if (this.idExam) {
      await this.loadExam(this.idExam);
    } else {
      this.idExam = undefined
    }
  }




  async loadExam(idExam: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando exámenen' })
      let exams = await lastValueFrom(this.examsSvc.getExamById(idExam));
      this.loaderSvc.hide()
      if (exams.ok && exams.data) {
        this.currentExam = exams.data;
        this.formExam.patchValue(this.currentExam)

        if (this.currentExam.listRequeriments && Array.isArray(this.currentExam.listRequeriments)) {
          this.loadRequirements(this.currentExam.listRequeriments);
        } else {
          console.warn('No se encontraron requisitos en los datos recibidos.');
        }

      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'Error al cargar el examen seleccionado', '4')
        this.currentExam = undefined
      }
    } catch (error) {
      this.modalSvc.openStatusMessage('Aceptar', 'Error al cargar el examen seleccionado', '4')
      this.currentExam = undefined
      this.loaderSvc.hide()
    }
  }

  //Traer cups
  async getCups() {
    try {

      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando listado de CUPS' });
      let cupsData = await lastValueFrom(this.examsSvc.getListCups());
      this.loaderSvc.hide();
      if (cupsData.ok && cupsData.data.length) {
        let cups = [];
        for (let i = 0; i < 50; i++) {
          cups.push(cupsData.data[i])
        }
        //this.listExamsCups = cups.map((exam: any) => {
        this.listExamsCups = cupsData.data.map((exam: any) => {
          let codename = exam.code + " - " + exam.name
          return {
            codename: codename,
            code: exam.code,
            idService: exam.idService,
          }
        });
      } else {
        this.modalService.openStatusMessage('Cerrar', 'Error al trear el listado de CUPS', '4')
      }



    } catch (error) {
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Cerrar', 'Error al trear el listado de CUPS', '4')
    }
  }
  //


  toggleEssentialRequirement(index: number, event: boolean) {
    const formArray = this.formExam.get('listRequeriments') as FormArray | null;

    if (formArray) {
      const requisito = formArray.at(index);
      if (requisito && requisito.get('essentialRequirement')) {
        requisito.get('essentialRequirement')?.setValue(event);
      } else {
        console.error('El control "essentialRequirement" no está disponible para el requisito en el índice', index);
      }
    } else {
      console.error('El FormArray "listRequeriments" no está disponible.');
    }
  }


  agregarRequisito() {
    const formArray = this.formExam.get('listRequeriments') as FormArray;
    formArray.push(this.fb.group({
      idRequerimentExam: [0],
      requirements: [''],
      essentialRequirement: [false],
      active: [true],
      dataRemoved: [false]
    }));
  }

  eliminarRequisitosActivos() {
    const formArray = this.formExam.get('listRequeriments') as FormArray;

    if (!formArray) {
      console.error('El FormArray "listRequeriments" no está disponible.');
      return;
    }

    for (let i = 0; i < formArray.length; i++) {
      const requisito = formArray.at(i) as FormGroup;

      if (requisito.get('dataRemoved')?.value) {
        requisito.get('active')?.setValue(false);

        if (!requisito.contains('isHidden')) {
          requisito.addControl('isHidden', new FormControl(true));
        } else {
          requisito.get('isHidden')?.setValue(true);
        }
        if (requisito.get('idRequerimentExam')?.value){
          this.eliminados.push(requisito.value.idRequerimentExam);
        }

        //  requisito.get('dataRemoved')?.setValue(false);
      }
    }

    // Filtra los requisitos que no están marcados para eliminación
    const activeRequirements = this.listRequeriments.controls.filter(
      (control) => !control.get('dataRemoved')?.value
    );

    // Vacía el FormArray y vuelve a agregar los requisitos activos
    this.listRequeriments.clear();
    activeRequirements.forEach((control) => {
      this.listRequeriments.push(control);
    });

    // Aquí, el FormArray ya está reorganizado, y los índices de los controles son los correctos.

  }

  // Obtener FormArray para listRequeriments
  get listRequeriments(): FormArray<FormGroup> {
    return this.formExam.get('listRequeriments') as FormArray<FormGroup>;
  }

  cancel() {
    this.router.navigate(['/inicio/parametrizacion/examenes'])
  }

  loadRequirements(requirements: any[]) {
    const formArray = this.listRequeriments;
    formArray.clear();

    requirements.forEach(req => {
      formArray.push(this.fb.group({
        idRequerimentExam: [req.idRequerimentExam || 0],
        requirements: [req.requirements || ''],
        essentialRequirement: [req.essentialRequirement || false],
        active: [req.active || true],
        dataRemoved: [false]
      }));
    });
  }

  async save() {

    if (this.formExam.valid) {
      let obj: ExamLaboratory = {
        idExam: this.idExam ? this.idExam : 0,
        cups: this.fv.cups || '',
        examName: this.fv.examName || '',
        preconditions: this.fv.preconditions || '',
        indications: this.fv.indications || '',
        biologicalSex: this.fv.biologicalSex || '',
        listRequeriments: this.fv.listRequeriments,
        listIdsRequerimentExam : this.eliminados.length ? this.eliminados: [],
        fullNameUserAction: this.nombreUsuario,
        idUserAction: this.idUser,
        active: true
      }

      try {

        this.loaderSvc.show();
        this.loaderSvc.text.set({ text: `${this.idExam ? 'Actualizando' : 'Guardando'} examen` });
        let r = await lastValueFrom(this.examsSvc.saveOrUpdateExam(obj));
        this.loaderSvc.hide()
        if (r.ok) {
          this.TrazabilityCreateUptateExam(obj)
          this.modalService.openStatusMessage('Aceptar', `Examen ${this.idExam ? 'actualizado' : 'creado'} correctamente en el sistema`, '1');
          this.cancel();
        } else {
          this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al  ${this.idExam ? 'actualizar' : 'crear'} el examen en el sistema`, '3');
        }


      } catch (error) {
        this.modalService.openStatusMessage('Aceptar', `Ocurrio un error al  ${this.idExam ? 'actualizar' : 'crear'} el examen en el sistema`, '4');
      }
    } else {
      this.formExam.markAllAsTouched();
    }
  }


  TrazabilityCreateUptateExam(newTraza: ExamLaboratory) {
    let antes = null
    let despues = null
    if (this.idExam) {
      antes =
      {
        active: this.currentExam.active || true,
        biologicalSex: this.currentExam.biologicalSex,
        cups: this.currentExam.cups,
        examName: this.currentExam.examName,
        fullNameUserAction: this.currentExam.fullNameUserAction, ///DEBE REVISARSE PARA QUE LLEGUE DESDE BACKEND
        idExam: this.currentExam.idExam,
        idUserAction: this.currentExam.idUserAction ,///DEBE REVISARSE PARA QUE LLEGUE DESDE BACKEND
        indications: this.currentExam.indications ,
        listRequeriments: this.currentExam.listRequeriments  &&  this.currentExam.listRequeriments.length > 0 ? this.currentExam.listRequeriments : null,
        preconditions: this.currentExam.preconditions ,
      }
      despues = newTraza;
      despues.listRequeriments = newTraza.listRequeriments &&  newTraza.listRequeriments.length > 0 ? newTraza.listRequeriments  : null
    } else {
      antes = newTraza;
    }

    this.idExam ? this.trazabilidad(antes, despues, 2, 'Edición') : this.trazabilidad(antes, null, 1, 'Creación');
  }


  trazabilidad(
    antes: any, despues: any | null, idMovimiento: number, movimiento: string) {

    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 11,
      idMovimiento,
      modulo: 'Parametrización',
      movimiento,
      subModulo: 'Exámenes de laboratorio',
    };
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

}
