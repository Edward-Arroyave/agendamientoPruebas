import { JsonPipe, NgClass } from '@angular/common';
import { Component, effect, Input, OnInit, output, signal, input, computed, OnChanges, SimpleChanges, TemplateRef, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { ElementsService } from '@app/services/parametrizacion/elements/elements.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TooltipIfTruncatedDirective } from '@app/shared/directivas/tooltip-if-truncated.directive';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { Categoria, categoryPlace } from '@app/shared/interfaces/parametrizacion/categoria.model';
import { Sede } from '@app/shared/interfaces/sedes/sedes.model';
import { IPacienteHis } from '@app/shared/interfaces/usuarios/paciente-his.model';
import { User } from '@app/shared/interfaces/usuarios/users.model';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { NgxPaginationModule, PaginationInstance } from 'ngx-pagination';
import { lastValueFrom, Subject, takeUntil, } from 'rxjs';
import { ExamsLaboratoryService } from '../../../../../../services/exams-laboratory/exams-laboratory.service';
import { ExamLaboratory, GetExam } from '@app/shared/interfaces/exams-laboratory/exams-laboratory.model';
import { IElementoExamen, ListExamDetail } from '@app/shared/interfaces/parametrizacion/elementos.model';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatCheckbox } from '@angular/material/checkbox';
import { IExamenesPorElementos, IGetDataAgendaEspacios } from '@app/shared/interfaces/agendar-cita/agendar-cita.interface';
import { PatientService } from '@app/services/pacientes/patient.service';

@Component({
  selector: 'app-step-3',
  standalone: true,
  imports: [
    BasicInputComponent,
    NgxPaginationModule,
    TooltipIfTruncatedDirective,
    MatTooltip,
    MatRadioButton,
    MatRadioGroup,
    MatCheckbox,
    MatIcon,
    NgClass,
    ReactiveFormsModule,
  ],
  templateUrl: './step-3.component.html',
  styleUrl: './step-3.component.scss'
})
export class Step3Component implements OnInit, OnChanges {

  @ViewChild('ExamenesPorElemento') ExamenesPorElementoTemplate!: TemplateRef<any>;
  @ViewChildren('checkeds') checkeds!: QueryList<MatCheckbox>;
  @ViewChild('dataCompanion') dataCompanion: TemplateRef<any> | undefined;

  @Input() formProcedimiento!: FormGroup;
  @Input() formParametros!: FormGroup;
  @Input() formRemitido!: FormGroup;
  @Input() paciente!: IPacienteHis;
  @Input() fullName!: string;
  @Input() contractCodeParticular!: string;
  @Input() pendiente!: boolean;
  @Input() pacienteParticularFlag!: boolean;
  @Input() listaPendientes!: number[];
  @Input() listaIdExamenesSelected = signal<number[]>([]);
  @Input() formCompanion!: FormGroup;
  @Input() formButtonCompanion!: FormControl;

  nombreUsuario: string = this.sharedService.obtenerNameUserAction();

  onPendientes = output<number[]>();
  onSelected = output<number[]>();
  onSiguiente = output<any | null>();
  onLimpiarSiguiente = output<boolean>();
  buscarFlag = input.required<boolean>();
  flagNext = signal<boolean>(false); //muestra la informacion de la tabla o el formulario depende de buscarFlag
  flagExamenDeLabotorio = signal<boolean | undefined>(false);

  listaExamenesPorElementos: IElementoExamen[] = [];
  listaExamenesPorElementosCopy: IElementoExamen[] = [];
  listaExamenesPorElementosSelected!: IElementoExamen;

  emitirValor: any;
  countryId: number = 0;
  listaProcedimientos: any[] = [];
  listaProcedimientosCopy: any[] = [];
  departamentos: any[] = [];
  cuidades: any[] = [];
  sedes: Sede[] = [];
  categorias: Categoria[] = [];
  listaExamenes: GetExam[] = [];
  listaExamenes2 = signal<GetExam[]>([]);

  listaRecomendaciones: any[] = [
    'Sede Calle 116 > Médicos > TM - Tomografía > Equipo de Rayos X Maximo contraste > Resonancia de articulación temporomandibular',
    'Sede Calle 120 > Médicos > TM - Tomografía > Equipo de Rayos X Maximo contraste > Resonancia de articulación temporomandibular',
  ];

  departament: number = 0;

  // Paginador
  paginadorNumber = signal<number>(7);
  p: number = 1;
  columnsBody = signal<any[]>([]);
  pagedData: any[] = [];

  config: PaginationInstance = {
    id: 'paginador',
    itemsPerPage: this.paginadorNumber(),
    totalItems: this.columnsBody().length,
    currentPage: this.p
  };

  formSearch: FormGroup = this.fb.group({
    search: []
  });

  relationship: any[] = [];
  listaDocumentos: any[] = [];

  contratoRemitido:string = '';


  constructor(
    private modalService: ModalService,
    private elmentoService: ElementsService,
    private loaderSvc: LoaderService,
    private sharedService: SharedService,
    private dialog: MatDialog,
    private examService: ExamsLaboratoryService,
    private fb: FormBuilder,
    private patientSvc: PatientService,


  ) {
    effect(x => {
      this.updatePagedData();
    });
  }
  async ngOnChanges(changes: any) {
    if (changes?.listaIdExamenesSelected) {
      if (changes?.listaIdExamenesSelected?.currentValue) {
      } else {
        this.listaIdExamenesSelected.set(changes.listaIdExamenesSelected.previousValue);
        const idExamenes: number[] = this.formProcedimiento.get('listIdExamens')?.value;
        this.onSelected.emit(this.listaIdExamenesSelected());
        await this.getCountries();
        await this.getExams().then(y => this.getListaExamenes(idExamenes))
      }
    }

    if (changes.buscarFlag.currentValue) {
      if (!this.pendiente) {
        await this.getCountries();
        await this.getProcedimiento();
      }
    } else {
      this.flagNext.set(false);
    }

    if (this.pendiente) {
      if (this.listaPendientes.length) {
        this.listaIdExamenesSelected.set(this.listaPendientes);
        this.formProcedimiento.get('listIdExamens')?.setValue(this.listaPendientes);
      }
      this.getExams();
      setTimeout(() => {
        this.getCountries();
        this.modalExamenesPorElemento(this.ExamenesPorElementoTemplate);
      }, 500);
    }
  }

  ngOnInit(): void {
    this.getCountries();
    this.cambiosFormulario();
    this.filterSearch();

    this.contratoRemitido = this.formRemitido.get('plan')?.value;
    !this.contratoRemitido? this.contratoRemitido = this.contractCodeParticular : '';
  }

  cambiosFormulario() {
    this.formProcedimiento.get('idDepartment')?.valueChanges.subscribe(x => {
      if (x) {
        this.departament = x
        this.getCities(x);
        this.formProcedimiento.get('idCity')?.reset();
        this.formProcedimiento.get('idAttentionCenter')?.reset();
        this.formProcedimiento.get('search')?.reset("");
        this.columnsBody.set([]);
      }
    })
    this.formProcedimiento.get('idCity')?.valueChanges.subscribe(x => {
      if (x) {
        this.getSede(x);
        this.getCategory(x);
        this.formProcedimiento.get('idAttentionCenter')?.reset();
        this.formProcedimiento.get('search')?.reset("");
        this.columnsBody.set([]);
      }
    })
    this.formProcedimiento.get('idCategory')?.valueChanges.subscribe(x => {
      if (x) {
        this.flagExamenDeLabotorio.set(this.categorias.find(y => y.idCategory === x)?.associatedExam);
        if (this.flagExamenDeLabotorio()) {
          this.getExams();
          this.formProcedimiento.get('listIdExamens')?.setValidators([Validators.required]);
        } else {
          this.formProcedimiento.get('listIdExamens')?.clearValidators();
        }
        this.formProcedimiento.get('listIdExamens')?.updateValueAndValidity();
      }
    })


  }

  resetFormProcedimiento() {
    this.formProcedimiento.reset({ search: "" });
    this.columnsBody.set([]);
  }

  updatePagedData() {
    const start = (this.p - 1) * this.paginadorNumber();
    const end = start + this.paginadorNumber();
    this.pagedData = this.columnsBody().slice(start, end);
  }


  handlePageChange(event: number) {
    this.p = event;
    this.updatePagedData();
  }


  async getCountries() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando paises...' })
      let items = await lastValueFrom(this.sharedService.getCountries())
      if (items.data) {

        const data: any[] = items.data;
        this.countryId = data.find(x => String(x.country).split('-')[1].trim().includes(this.paciente.country)).idCountry;
        this.getDepartaments(this.countryId);
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }

  async getCities(idDepartment: any) {
    try {

      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando cuidades' })
      let items = await lastValueFrom(this.sharedService.getCities(idDepartment));
      if (items.data) {
        this.cuidades = items.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }
  async getDepartaments(idCountry: any) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando departamentos' })
      let items = await lastValueFrom(this.sharedService.getDepartaments(idCountry));
      if (items.data) {
        this.departamentos = items.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  async getCategory(idCity: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando categorias...' })
      const categoryPlaceObj: categoryPlace = {
        idCity: idCity,
        idCountry: this.countryId,
        idDepartment: this.departament
      }
      let items = await lastValueFrom(this.sharedService.getCategoryPlace(categoryPlaceObj));
      if (items) {
        this.categorias = items.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }

  async getSede(idCity: number) {
    try {

      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando sedes' })
      let items = await lastValueFrom(this.sharedService.getSedesbyCity(idCity));
      if (items.data) {
        this.sedes = items.data;
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }
  }

  async getExams() {
    await lastValueFrom(this.examService.getAllExam()).then(x => {
      this.listaExamenes = x.data;
    }).catch(e => {
      console.error(e)
    })
  }

  filterSearch() {
    this.formSearch.get('search')?.valueChanges.subscribe(x => {

      if (x && this.listaProcedimientosCopy.length) {
        let word = x.toLowerCase();
        let datos = this.listaProcedimientosCopy.filter(s =>
          s.attentionCenterName?.toLowerCase().includes(word) ||
          s.categoryName?.toLowerCase().includes(word) ||
          s.characteristicName?.toLowerCase().includes(word) ||
          s.elementName?.toLowerCase().includes(word) ||
          s.specialConditionName?.toLowerCase().includes(word) ||
          s.specialtiesName?.toLowerCase().includes(word) ||
          s.cups?.toLowerCase().includes(word) ||
          s.internalCode?.toLowerCase().includes(word)
        );

        this.columnsBody.set(datos);
        // if(!datos.length){
        //   this.columnsBody.set(this.listaProcedimientosCopy);
        // }
      } else {
        this.columnsBody.set(this.listaProcedimientosCopy);
      }
    })
  }


  async getProcedimientoNoLab(requireElements: boolean) {
    const data: IGetDataAgendaEspacios = { elements: requireElements, ...this.formProcedimiento.value ,contractElement : this.contratoRemitido};
    const resp = await lastValueFrom(this.elmentoService.getProcedimientoPorAgenda(data))
    if (resp.ok) {
      this.listaProcedimientos = resp.data;
      this.listaProcedimientosCopy = resp.data.slice();
      this.formSearch.get('search')?.setValue('')
      this.columnsBody.set(this.listaProcedimientos);
      this.flagNext.set(true);
      this.loaderSvc.hide();
    } else {
      this.modalService.openStatusMessage('Cancelar', 'No se encontró información relacionada a los datos digitados', '4');
      this.formSearch.get('search')?.setValue('')
      this.columnsBody.set([]);
      this.flagNext.set(false);
      this.onLimpiarSiguiente.emit(false);
    }
    this.loaderSvc.hide();
  }

  async getProcedimientoLab() {


    if (!this.listaExamenes2().length) {
      const idExamenes: number[] = this.formProcedimiento.get('listIdExamens')?.value;
      await this.getExams().then(async y => await this.getListaExamenes(idExamenes));
    }

    const data: IGetDataAgendaEspacios = {contractElement : this.contratoRemitido, idElement: this.formParametros.get('idElement')?.value, ...this.formProcedimiento.value };
    const resp = await lastValueFrom(this.elmentoService.getProcedimientoPorAgenda(data))
    if (resp.ok) {
      this.listaProcedimientos = resp.data;
      this.listaProcedimientosCopy = resp.data;
      this.formSearch.get('search')?.setValue('')
      this.columnsBody.set(this.listaProcedimientos);
      this.flagNext.set(true);
      this.listaPendientes = this.listaExamenes2().filter(z => !this.listaIdExamenesSelected().includes(z.idExam) && this.noContieneExamen(z.idExam)).map(x => x.idExam);
      this.onPendientes.emit(this.listaPendientes);
      this.onSelected.emit(this.listaIdExamenesSelected());
      this.loaderSvc.hide();

    } else {
      this.modalService.openStatusMessage('Cancelar', 'No se encontró información relacionada a los datos digitados', '4');
      this.columnsBody.set([]);
      this.formSearch.get('search')?.setValue('')
      this.flagNext.set(false);
      this.onLimpiarSiguiente.emit(false);
    }
    this.loaderSvc.hide();
  }

  async getProcedimiento() {
    this.formProcedimiento.get('idCountry')?.setValue(this.countryId);
    if (this.formProcedimiento.invalid) {
      this.onLimpiarSiguiente.emit(false);
      return this.modalService.openStatusMessage('Cancelar', 'Por favor complete los campos', '4');
    }

    try {
      this.p = 1;
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando preparación' });
      const idCategory = this.formProcedimiento.get('idCategory')?.value;
      const idExamenes: number[] = this.formProcedimiento.get('listIdExamens')?.value;
      if (!this.categorias.length) {
        if (idExamenes?.length) {
          this.getProcedimientoLab();
        } else {
          let idElement = this.formParametros.get('idElement')?.value;
          await this.getProcedimientoNoLab(idElement ? true : false);
        }
        return
      }
      const categorySelected = this.categorias.find(y => y.idCategory === Number(idCategory))
      if (categorySelected?.associatedExam) {
        this.modalExamenesPorElemento(this.ExamenesPorElementoTemplate);
        return
      }

      await this.getProcedimientoNoLab(categorySelected?.requireElements!);

    } catch (error) {
      this.modalService.openStatusMessage('Cancelar', 'Ha ocurrido un error insperado', '4');
      this.loaderSvc.hide();
      this.columnsBody.set([]);
      this.formSearch.get('search')?.setValue('')
      this.flagNext.set(false);
    }
  }

  async getListaExamenes(idExamenes: number[]) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando examenes' });
      const arr: GetExam[] = JSON.parse(JSON.stringify(this.listaExamenes));
      if (arr.length && idExamenes.length) {

        this.listaExamenes2.set(Object.assign([], arr.filter(y => idExamenes.includes(y.idExam))));
        this.listaExamenes2.update(x => x.map(y => {
          y.checked = false;
          return y
        }))
        this.loaderSvc.hide();
        await this.getExamenesConElementoPorIds(idExamenes);
      }
    } catch (error) {
      console.error(error)
    }
  }

  async getExamenesConElementoPorIds(idExamenes: number[]) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando examenes' });
      let obj: IExamenesPorElementos = {
        idCategory: Number(this.formProcedimiento.get('idCategory')?.value),
        listIdsExam: idExamenes.join(',')
      }
      await lastValueFrom(this.elmentoService.getExamenesConElementoPorIds(obj))
        .then(x => {
          if (x.ok) {
            const interfaz: IElementoExamen[] = [];
            this.listaExamenesPorElementos = Object.assign(interfaz.map(x => { x.checked = false; x.containAllExam = false; return x }),
              x.data
            );
            this.listaExamenesPorElementosCopy = Object.assign(interfaz.map(x => { x.checked = false; x.containAllExam = false; return x }),
              x.data
            );
            this.loaderSvc.hide();
          } else {
            this.loaderSvc.hide();
            this.modalService.openStatusMessage('Cancelar', 'No se encontraron exámenes relacionados a un elemento', '4');
          }
        })
    } catch (error) {
      this.modalService.openStatusMessage('Cancelar', 'Lo sentimos ha ocurrido un error inesperado', '4');
      console.error(error);
    }
  }

  noContieneExamen(idExamen: number) {
    let existencia = false;
    this.listaExamenesPorElementos.map(x => {
      if (x.listExamDetail.find(y => y.idExam === idExamen)) {
        existencia = true;
      } else {
        existencia ? '' : existencia = false;
      }
      return x;
    });
    return existencia
  }

  contieneTodosExamenes(item: ListExamDetail[]) {
    if (item.length !== this.listaIdExamenesSelected().length) return false;
    return !this.listaIdExamenesSelected().map(d => {
      if (item.find(z => z.idExam === d)) {
        return true
      }
      return false
    }).includes(false);
  }

  contieneTodosExamenes2() {
    this.listaExamenesPorElementos.forEach(x => {
      x.containAllExam = false;
      const result = x.listExamDetail.map(y => {
        if (this.listaIdExamenesSelected().find(j => j === y.idExam)) {
          return true;
        }
        return false;
      });
      if (!result.includes(false) && result.length === this.listaIdExamenesSelected().length) x.containAllExam = true;
    })
  }

  checkExamenesModal(valor: boolean, idExamen: number) {
    let existencia = false;
    if (!valor) {
      this.listaIdExamenesSelected.set(this.listaIdExamenesSelected().filter(z => z !== idExamen));
    } else {
      if (!this.listaIdExamenesSelected().includes(idExamen)) {
        this.listaIdExamenesSelected().push(idExamen);
      }
    }

    this.listaExamenesPorElementos = this.listaExamenesPorElementos.map(x => {
      x.checked = false;
      if (x.listExamDetail) {
        if (x.listExamDetail.find(y => y.idExam === idExamen)) {
          x.checked = valor;
          existencia = true;
          return x;
        } else {
          existencia ? '' : existencia = false;
        }
      }
      return x;
    });
    if (!existencia) {
      this.listaIdExamenesSelected.set(this.listaIdExamenesSelected().filter(z => z !== idExamen));
    }
    this.contieneTodosExamenes2();
  }

  buscarMayorCoincidencia(idExamenes: number[]) {
    this.listaExamenesPorElementos.map(x => {
      x.countSimilary = 0;
      x.listExamDetail.map(z => {
        if (idExamenes.includes(z.idExam)) {
          x.countSimilary = x.countSimilary! + 1;
        }
      })
    })
    const ele = this.listaExamenesPorElementos.sort((a, b) => b.countSimilary! - a.countSimilary!)[0];
    ele.listExamDetail.map(j => {
      this.listaExamenes2().find(x => {
        if (x.idExam === j.idExam) {
          x.checked = true;
          this.checkExamenesModal(true, x.idExam);
        }
      })
    })

  }

  async modalExamenesPorElemento(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {
    this.listaIdExamenesSelected.set([]);;
    const idExamenes: number[] = this.formProcedimiento.get('listIdExamens')?.value;
    if (!this.listaExamenesPorElementos.length) {
      await this.getExamenesConElementoPorIds(idExamenes);
    }
    await this.getListaExamenes(idExamenes);
    this.buscarMayorCoincidencia(idExamenes);
    this.contieneTodosExamenes2();
    const destroy$: Subject<boolean> = new Subject<boolean>();
    const data: ModalData = {
      content: template,
      btn: 'Siguiente',
      btn2: this.pendiente ? undefined : 'Cancelar',
      footer: true,
      title: titulo,
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: '31.6em', width: '70em', data, disableClose: true });
    if (this.pendiente) {
      this.modalService.openStatusMessage('Cancelar', `Usuario ${this.nombreUsuario}, por favor realice el mismo proceso con el/los exámenes restantes.`, '3');
    }

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      const mssError = 'El elemento no contiene todos los examenes, se retirara el check del examen ya que no puede agendar en dos elementos diferentes a la vez, por lo que deberia realizar otro agendamiento con los examenes restantes y se le orientará en todo el proceso'
      if (!this.listaExamenesPorElementosSelected) {
        this.modalService.openStatusMessage('Cancelar', 'Elija un elemento', '4');
        return
      }
      if (!this.contieneTodosExamenes(this.listaExamenesPorElementosSelected.listExamDetail)) {
        idExamenes.forEach(x => {
          let ch = this.checkeds.find(g => g.id === x + 'check');
          let arrIdsExam = this.listaExamenesPorElementosSelected.listExamDetail.map(y => y.idExam === x);
          if (arrIdsExam.includes(true)) {
            if (ch) ch.checked = true;
            this.checkExamenesModal(true, x)
          } else {
            if (ch) ch.checked = false;
            this.checkExamenesModal(false, x)
          }
        });
        return this.modalService.openStatusMessage('Cancelar', mssError, '3', undefined, '40em');
      }

      this.formParametros.get('idElement')?.setValue(this.listaExamenesPorElementosSelected.idElement);
      this.loaderSvc.show();
      this.getProcedimientoLab();
      dialogRef.close();
    });
    dialogRef.componentInstance.secondaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      this.flagNext.set(false);
      this.onLimpiarSiguiente.emit(false);
      dialogRef.close();
    });
  }

  siguiente(value: any | null) {
    this.onPendientes.emit(this.listaPendientes);
    this.emitirValor = value;
    this.onSiguiente.emit(value);
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
      this.formButtonCompanion.setValue(false);
      this.formCompanion.reset();
    }



  }

}
