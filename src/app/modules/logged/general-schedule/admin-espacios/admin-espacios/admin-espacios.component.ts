import { Dialog } from '@angular/cdk/dialog';
import { DatePipe, JsonPipe, NgClass, registerLocaleData } from '@angular/common';
import { Component, ElementRef, HostListener, LOCALE_ID, QueryList, Renderer2, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, ActivatedRoute } from '@angular/router';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SedesService } from '@app/services/sedes/sedes.service';
import { AdminEspaciosService } from '@app/services/servicios-agendamiento/admin-espacios/admin-espacios.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ConsultAdminEspacio } from '@app/shared/interfaces/agendamiento/admin-espacion.model';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { TarjetaPacienteComponent } from '@app/shared/tabla/tarjeta-paciente/tarjeta-paciente.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { AgendarEspacioComponent } from "../agendar-espacio/agendar-espacio.component";
import { FormatTimePipe } from '@app/pipes/format-time.pipe';
import localEs from '@angular/common/locales/es'
import { ExamsLaboratoryService } from '../../../../../services/exams-laboratory/exams-laboratory.service';
import { GetExam } from '@app/shared/interfaces/exams-laboratory/exams-laboratory.model';
import { IElementoExamen, ListExamDetail } from '@app/shared/interfaces/parametrizacion/elementos.model';
import { ElementsService } from '@app/services/parametrizacion/elements/elements.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { IExamenesPorElementos, IGetDataAgendaEspacios } from '@app/shared/interfaces/agendar-cita/agendar-cita.interface';
import { HubService } from '@app/services/hubs/hub.service';
import { IGetHomologateEntity } from '@app/shared/interfaces/interoperability/dictorionary-model';
import { ProcedenciasService } from '../../../../../services/administracion/procedencias/procedencias.service';
import { IProcedencia } from '@app/shared/interfaces/procedencias/procedencias.model';
import { PaymentGatewayService } from '@app/services/payment-gateway/payment-gateway.service';

registerLocaleData(localEs, 'es');
@Component({
  selector: 'app-admin-espacios',
  standalone: true,
  imports: [NgClass,
    MatTooltipModule,
    BasicInputComponent,
    ReactiveFormsModule,
    MatIconModule,
    MatCheckbox,
    MatRadioButton,
    MatRadioGroup,
    TarjetaPacienteComponent,
    NgxPaginationModule,
    AgendarEspacioComponent,
    DatePipe,
    FormatTimePipe,
  ],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ],
  templateUrl: './admin-espacios.component.html',
  styleUrl: './admin-espacios.component.scss'
})
export class AdminEspaciosComponent {

  @ViewChild('ExamenesPorElemento') ExamenesPorElementoTemplate!: TemplateRef<any>;
  @ViewChildren('checkeds') checkeds!: QueryList<MatCheckbox>;


  formulario = this.fb.group({
    idCountry: ['', Validators.required],
    idDepartment: ['', Validators.required],
    idCity: ['', Validators.required],
    idTypeAttention: ['', Validators.required],
    idAttentionCenter: ['',],
    idCategory: ['', Validators.required],
    idSpecialties: ['', Validators.required],
    idCharacteristic: ['', Validators.required],
    idTipoPaciente: ['', Validators.required],
    idOriginEntity: [0],
    plan: [""],
    idElement: [0],
    listIdExamens: [this.fb.array([]), []],
    desiredDate: ['',],
    creatinineResultDate: ['',],
    creatinineResult: ['',],
  });

  contrato: string = "";
  formBackup: any;
  currentIdCategory: any = null;
  currentIdCity: any = null;
  currentIdSpecialties: any = null;
  currentIdCharacteristic: any = null;
  currentIdElement: any = null;


  departamentos: any[] = [];
  cuidades: any[] = [];
  paises: any[] = [];
  sedes: any[] = [];
  categorias: any[] = [];
  especialidades: any[] = [];
  caracteristicas: any[] = [];
  elementos: any[] = [];
  condicionesEspeciales: any[] = [];
  tiposAtencion: any[] = [{ id: 1, name: 'Presencial', checked: false, }, { id: 2, name: 'Virtual', checked: false, }];
  espacios: any[] = [];

  listaExamenesPorElementos: IElementoExamen[] = [];
  listaExamenesPorElementosCopy: IElementoExamen[] = [];
  listaExamenesPorElementosSelected!: IElementoExamen;
  listaIdExamenesSelected: number[] = [];

  tabs: any = [{ id: 1, number: 1, name: 'Búsqueda', completed: false }, { id: 2, number: 2, name: 'Espacios', completed: false },]

  currentTabId: number = 1;

  headers = ['País', 'Departemento', 'Ciudad', 'Categoria', 'Característica', 'Tipo de atención', 'Fecha deseada', 'Sede', 'Especialidad', 'Elemento', 'Condición especial']
  subHeaders = ['Colombia', 'Cundinamarca', 'Bogota', 'Imagenes diagnisticoad', 'Equipo de Rayos X Maximo contraste', 'Presencial', '28/9/2024', 'Sede calle 116', 'RM - Resonancia', 'Resonancia de articulacion temporaamndiblular', 'Contrastado']
  cabeceros: string[] = ['Sede', 'Fecha', 'Hora', 'Espacio', 'Estado', 'Agendar'];
  listaTipoUsuario: any[] = [
    {
      value: "Particular",
      id: 1
    },
    {
      value: "Remitido",
      id: 2
    },
  ];

  listaEntidades: IProcedencia[] = [];
  listaExamenes: GetExam[] = [];
  listaExamenes2: GetExam[] = [];
  listPlan: any[] = [];
  paginadorNumber = 5;

  p: number = 1;
  pagedData: any[] = [];
  permisosDelModulo: any

  agendarEspacio: boolean = false;
  requiereElementos: boolean = false;
  requiereTomaDeMuestras: boolean = false;

  dataGeneral: any;
  Nephroprotection: any;
  itemAgenda: any;
  paciente: any = undefined;
  formRemitido: any = undefined;
  pacienteParticularFlag: any = undefined
  remitidoFlag: boolean = false;

  minDate = new Date();

  constructor(
    private shadedSVC: SharedService,
    private fb: FormBuilder,
    private router: Router,
    private loaderSvc: LoaderService,
    private modalService: ModalService,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private dialog: MatDialog,
    private admEspaciosSvc: AdminEspaciosService,
    private datePipe: DatePipe,
    private examService: ExamsLaboratoryService,
    private elmentoService: ElementsService,
    private hubService: HubService,
    private procedenciasService: ProcedenciasService,
    private paymentGatewayService: PaymentGatewayService
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Administración de espacios')


    this.hubService.on('Cita', (cita: any) => {
      if (this.espacios.length && this.pagedData.length) {
        let sede = cita.data.idAttentionCenter
        let characteristic = cita.data.idCharacteristic
        const fechaCita = new Date(cita.data.desiredDate).toISOString().split('T')[0];
        this.espacios = this.espacios.filter((a: any) => {
          return (
            Number(this.fv.idCharacteristic) !== characteristic ||
            a.idSede !== sede ||
            new Date(a.desiredDate).toISOString().split('T')[0] !== fechaCita ||
            a.startTime !== cita.data.startTime ||
            a.endTime !== cita.data.endTime
          );
        });
        this.updatePagedData();
      }
    })
  }

  get fv() {
    return this.formulario.value
  }
  get fc() {
    return this.formulario.controls
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

  private ajustarAlto() {

    if (this.agendarEspacio) return
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.tabs-container').offsetHeight;
    let he = container - header - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.content-tab'), 'height', `${he}px`);
    let paginador = he / 30;


    this.paginadorNumber = Math.floor(paginador / 2);
    if (this.paginadorNumber < 5) {
      this.paginadorNumber = 5
    }
    this.p = 1;
    this.updatePagedData();


  }



  async ngOnInit(): Promise<void> {
    await this.getCountries();
    this.filtrosInputs();
    await this.getProcedencias();
    await this.contratoParticular();
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

  async getPlanByEntity(entity: number) {
    try {
      const dataHomologate: IGetHomologateEntity = {
        code: entity.toString(),
        dictionaryName: 'Tercero',
        idIntegration: 1,
        searchOwn: false
      }
      const responseHomologate = await lastValueFrom(this.procedenciasService.getHomologationEntity(dataHomologate));
      if (responseHomologate.ok) {
        this.formulario.get('plan')?.reset();
        this.loaderSvc.show()
        this.loaderSvc.text.set({ text: 'Cargando planes de la entidad' })
        let documents = await lastValueFrom(this.procedenciasService.getListThirtContracts(responseHomologate.data));
        documents.ok ? this.listPlan = documents.data : this.modalService.openStatusMessage("Cancelar", "No se encontraron contratos relacionados a la entidad", "4");
      } else {
        this.modalService.openStatusMessage('Cancelar', 'No se encontró homologaciones relacionadas a la entidad', '4');
        this.listPlan = [];
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.modalService.openStatusMessage('Cancelar', 'No se encontraron contratos relacionados a la entidad', '4');
      this.listPlan = [];
      this.loaderSvc.hide();
    }
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
        this.formulario.get('idOriginEntity')?.valueChanges.subscribe(async x => {
          if (x) {
            //Cargar planes segun la entidad
            await this.getPlanByEntity(x);
          }
        });
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  async contratoParticular() {
    try {
      const costo = await lastValueFrom(this.paymentGatewayService.contratoParticular());
      this.contrato = costo.data.particularContractCode;
    } catch (error) {
      this.modalService.openStatusMessage('Cancela', 'No se encontro el contrato particular', '4');
    }
  }

  filtrosInputs() {
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
    this.fc.idCity.valueChanges.subscribe(async p => {
      if (p) {
        await this.getSedesbyCity(Number(p))
        await this.getCategory(Number(p))
      }
    })
    this.fc.idCategory.valueChanges.subscribe(async p => {
      if (p) {
        await this.getEspecialidad(Number(p));
      }
    })
    this.fc.idSpecialties.valueChanges.subscribe(async p => {
      if (p) {
        await this.getCaracteristicas(Number(p));

      }
    })
    this.fc.idCharacteristic.valueChanges.subscribe(async p => {
      if (p && this.requiereTomaDeMuestras) {
        await this.getElementos(Number(p));

      }
    })

    this.fc.idTipoPaciente.valueChanges.subscribe(async p => {
      this.fc.idElement.reset();
      if (p) {
        this.validatorRequired(this.formulario, 'idOriginEntity');
        this.validatorRequired(this.formulario, 'plan');
        if (p == "1") {
          this.validatorRemoved(this.formulario, 'idOriginEntity');
          this.validatorRemoved(this.formulario, 'plan');
          this.remitidoFlag = false;
          if (!this.requiereTomaDeMuestras) {
            await this.getElementos(Number(p));
          }
        } else { this.remitidoFlag = true; }
      } else {
        this.validatorRemoved(this.formulario, 'idOriginEntity');
        this.validatorRemoved(this.formulario, 'plan');
      }
    })

    this.fc.plan.valueChanges.subscribe(async p => {
      if (p) {
        this.contrato = p;
        await this.getElementos(Number(p));
      }
    })
  }

  async getExams() {
    await lastValueFrom(this.examService.getAllExam()).then(x => {
      this.listaExamenes = x.data;
      this.listaExamenes2 = Object.assign([], x.data);
    }).catch(e => {
      console.error(e)
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
      this.fc.idCity.reset()
      this.fc.idAttentionCenter.reset()
      let items = await lastValueFrom(this.shadedSVC.getDepartaments(pais));
      if (items.data) {
        this.departamentos = items.data;
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
      this.fc.idAttentionCenter.reset()
      this.fc.idCategory.reset()
      this.cuidades = []
      let items = await lastValueFrom(this.shadedSVC.getCities(department));
      if (items.data) {
        this.cuidades = items.data;
        if (this.currentIdCity) {
          this.fc.idCity.setValue(this.currentIdCity)
          this.currentIdCity = null
        }
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }
  async getSedesbyCity(idCity: any) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando sedes' })
      this.fc.idAttentionCenter.reset()
      this.sedes = []
      let items = await lastValueFrom(this.shadedSVC.getSedesbyCity(idCity));

      if (items.ok) {
        this.sedes = items.data;
      } else {
        this.sedes = [];
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.sedes = [];
      this.loaderSvc.hide()
    }

  }
  async getCategory(idCity: number) {

    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando categorias' })
      if (!this.currentIdCategory) {
        this.fc.idCategory.reset()
        this.fc.idSpecialties.reset()
        this.fc.idCharacteristic.reset()
        this.fc.idElement.reset()
        this.categorias = []
        this.especialidades = []
        this.caracteristicas = []
        this.elementos = []
      }

      let items = await lastValueFrom(this.shadedSVC.getCategoryByCity(idCity));
      this.loaderSvc.hide()
      if (items.ok) {
        this.categorias = items.data;
        if (this.currentIdCategory) {
          this.fc.idCategory.setValue(this.currentIdCategory)
          this.currentIdCategory = null
        }
      }
    } catch (error) {
      this.loaderSvc.hide()
    }

  }
  async getEspecialidad(idCategory: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando especialidades' })
      if (!this.currentIdSpecialties) {
        this.fc.idSpecialties.reset()
        this.fc.idCharacteristic.reset()
        this.fc.idElement.reset()
        this.validarObligatoriedadElemento(idCategory);
        this.especialidades = []
        this.caracteristicas = []
        this.elementos = []
      }

      let items = await lastValueFrom(this.shadedSVC.getSpecialization(idCategory));
      this.loaderSvc.hide()
      if (items.ok) {
        this.especialidades = items.data;
        const result = this.categorias.find(x => x.idCategory === idCategory);
        this.requiereElementos = result.requireElements;
        this.requiereTomaDeMuestras = result.associatedExam;

        if (this.requiereTomaDeMuestras) {
          this.formulario.get('listIdExamens')?.setValue(null);
          this.formulario.get('listIdExamens')?.setValidators([Validators.required]);
          await this.getExams();
        } else {
          this.formulario.get('listIdExamens')?.clearValidators()
        };
        this.formulario.get('listIdExamens')?.updateValueAndValidity();
        setTimeout(() => {
          // if (this.formBackup.idSpecialties) {
          //   this.fc.idSpecialties.setValue(this.formBackup.idSpecialties)
          //   this.formBackup.idSpecialties = null
          // }
          if (this.currentIdSpecialties) {
            this.fc.idSpecialties.setValue(this.currentIdSpecialties)
            this.currentIdSpecialties = null
          }
        }, 100);
      }


    } catch (error) {
      this.loaderSvc.hide()
    }
  }
  async getCaracteristicas(idSpeciality: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando caracteristicas' })
      this.fc.idCharacteristic.reset()
      this.fc.idElement.reset()
      this.caracteristicas = []
      this.elementos = []
      let items = await lastValueFrom(this.shadedSVC.getCharacteristic(idSpeciality));
      this.loaderSvc.hide()
      if (items.ok) {
        this.caracteristicas = items.data;
        setTimeout(() => {
          // if (this.formBackup.idCharacteristic) {
          //   this.fc.idCharacteristic.setValue(this.formBackup.idCharacteristic)
          //   this.formBackup.idCharacteristic = null
          // }

          if (this.currentIdCharacteristic) {
            this.fc.idSpecialties.setValue(this.currentIdCharacteristic)
            this.currentIdCharacteristic = null
          }
        }, 100);
      }

    } catch (error) {
      this.loaderSvc.hide()
    }
  }
  async getElementos(idCharacteristic: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando elementos' })
      const {
        idCategory,
        idSpecialties,
        idCity,
        idElement,
        idDepartment,
        idCountry } = this.fv;
      const data: any = {
        elements: this.requiereElementos,
        idElement: this.listaExamenesPorElementosSelected?.idElement,
        listIdExamens: this.requiereTomaDeMuestras ? this.listaExamenes.map(x => x.idExam).join(',') : null,
        idCategory,
        idSpecialties,
        idCity,
        idDepartment,
        idCountry,
        contractElement: this.contrato
      };
      // this.fc.idElement.reset();

      if (this.requiereTomaDeMuestras) {
        this.fc.idElement.reset()
        this.elementos = []
        let items = await lastValueFrom(this.shadedSVC.getElementos(idCharacteristic));
        this.loaderSvc.hide()
        if (items.ok) {
          this.elementos = items.data.map((e: any) => {
            e.checked = false
            e.elementName = e.internalCode + " - " + e.elementName + " - " + e.specialConditionName
            return e
          });
        }
      } else {
        const resp = await lastValueFrom(this.elmentoService.getProcedimientoPorAgenda(data))
        if (resp.ok) {
          this.elementos = resp.data.map((e: any) => {
            e.checked = false
            e.elementName = e.internalCode + " - " + e.elementName + " - " + e.specialConditionName
            return e
          }); ''
        }

        setTimeout(() => {
          // if (this.formBackup.idElement) {
          //   this.fc.idElement.setValue(this.formBackup.idElement)
          //   this.formBackup.idElement = null
          // }
          if (this.currentIdElement) {
            this.fc.idElement.setValue(this.currentIdElement)
            this.currentIdElement = null
          }
        }, 100);
      }
      this.loaderSvc.hide()
    } catch (error) {
      console.error(error)
      this.loaderSvc.hide()
    }
  }

  async getListaExamenes(idExamenes: any[]) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando examenes' });
      const arr: GetExam[] = JSON.parse(JSON.stringify(this.listaExamenes))
      this.listaExamenes2 = (Object.assign([], arr.filter(y => idExamenes.includes(y.idExam))));
      this.listaExamenes2.forEach(x => {
        x.checked = false;
      })
      this.loaderSvc.hide();

      await this.getExamenesConElementoPorIds(idExamenes);
    } catch (error) {
      console.error(error)
    }
  }

  async getExamenesConElementoPorIds(idExamenes: number[]) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando examenes' });
      let obj: IExamenesPorElementos = {
        idCategory: Number(this.fv.idCategory),
        listIdsExam: idExamenes.join(',')
      }
      await lastValueFrom(this.elmentoService.getExamenesConElementoPorIds(obj)).then(x => {
        const interfaz: IElementoExamen[] = [];
        this.listaExamenesPorElementos = Object.assign(interfaz.map(x => { x.checked = false; x.containAllExam = false; return x }),
          x.data
        );
        this.listaExamenesPorElementosCopy = Object.assign(interfaz.map(x => { x.checked = false; x.containAllExam = false; return x }),
          x.data
        );
        this.loaderSvc.hide();
      })
    } catch (error) {
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
    if (item.length !== this.listaIdExamenesSelected.length) return false;
    return !this.listaIdExamenesSelected.map(d => {
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
        if (this.listaIdExamenesSelected.find(j => j === y.idExam)) {
          return true;
        }
        return false;
      });
      if (!result.includes(false) && result.length === this.listaIdExamenesSelected.length) x.containAllExam = true;
    })
  }
  checkExamenesModal(valor: boolean, idExamen: number) {
    let existencia = false;
    if (!valor) {
      this.listaIdExamenesSelected = this.listaIdExamenesSelected.filter(z => z !== idExamen);
    } else {
      if (!this.listaIdExamenesSelected.includes(idExamen)) {
        this.listaIdExamenesSelected.push(idExamen);
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
      this.listaIdExamenesSelected = this.listaIdExamenesSelected.filter(z => z !== idExamen);
    }

    this.contieneTodosExamenes2();
  }

  buscarMayorCoincidencia(idExamenes: any[]) {
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
      this.listaExamenes2.find(x => {
        if (x.idExam === j.idExam) {
          x.checked = true;
          this.checkExamenesModal(true, x.idExam);
        }
      })
    })

  }

  async buscar(pendientes?: any[]) {
    this.validatorRemoved(this.formulario, "creatinineResult");
    this.validatorRemoved(this.formulario, "creatinineResultDate");
    if (this.formulario.valid) {

      if (this.fv.idElement || this.fv.idSpecialties) {
        this.formBackup = this.formulario.getRawValue();
        let obj: ConsultAdminEspacio = {
          idCity: this.formBackup.idCity,
          desiredDate: this.formBackup.desiredDate ? this.formBackup.desiredDate : null,
          idTypeAttention: this.formBackup.idTypeAttention ? this.formBackup.idTypeAttention : 0,
          haveExams: this.requiereTomaDeMuestras,
          idCountry: Number(this.fv.idCountry),
          idElement: this.fv.idElement ? this.fv.idElement : undefined,
          idSpecialties: !this.fv.idElement ? Number(this.fv.idSpecialties) : undefined,
          idCharacteristic: Number(this.fv.idCharacteristic)
        }

        try {
          this.loaderSvc.show()
          this.loaderSvc.text.set({ text: 'Cargando espacios de agenda' })

          let items = await lastValueFrom(this.admEspaciosSvc.getAvailableAgenda(obj))
          this.loaderSvc.hide()
          if (items.ok && items.data && items.data.length) {
            this.generarDetalle()
            let data;

            if (this.fv.idAttentionCenter) {
              data = items.data.filter((item: any) => item.idSede == this.fv.idAttentionCenter);
              if (data.length == 0) {
                this.modalService.openStatusMessage('Aceptar', 'No se encontraron espacios en la sede seleccionada.', '3')
                return
              }
            } else {
              data = items.data;
            }

            this.espacios = []
            this.p = 1;
            for (const e of data) {
              if (e.listDisponibilityAppointment.length) {
                for (const espacio of e.listDisponibilityAppointment) {
                  if (this.shadedSVC.EsRangoValido(espacio.desiredDate, espacio.startTime)) {

                    if (this.requiereTomaDeMuestras && !this.elementos.find(x => x.idElement == this.fv.idElement)?.elementName) {
                      this.modalService.openStatusMessage('Cancelar', 'Lo sentimos, la caracteristica seleccionada no cuenta con el elemento seleccionado, por favor elija otra caracteristica', '4');
                      return
                    }
                    let elemento = this.fv.idElement ? this.elementos.find(x => x.idElement == this.fv.idElement) : null;
                    let objeto = {
                      sede: e.sede,
                      desiredDate: espacio.desiredDate,
                      startTime: espacio.startTime,
                      espacio: espacio.isSufficient ? e.particularTime : this.cualcularTiempo(espacio.startTime, espacio.endTime),
                      estado: espacio.isSufficient,
                      isSufficient: espacio.isSufficient,
                      particularTime: e.particularTime,
                      endTime: espacio.endTime,
                      idAgenda: e.idAgenda,
                      idTypeAttention: this.fv.idTypeAttention,
                      iconName: e.iconName,
                      categoryName: this.categorias.find(s => s.idCategory == this.fv.idCategory).categoryName,
                      idCategory: this.fv.idCategory,
                      specialtiesName: this.especialidades.find(x => x.idSpecialties == this.fv.idSpecialties).specialtiesName,
                      idSpecialties: this.fv.idSpecialties,
                      elementName: elemento?.elementName || null,
                      cups2: elemento?.cups || null,
                      internalCode: elemento?.internalCode || null,
                      caracteristicaName: e.characteristicName,
                      duracion: this.cualcularTiempo(espacio.startTime, espacio.endTime),
                      creatinina: this.generarCreatininaItem(e, elemento.specialConditionName),
                      idSede: e.idSede,
                      pendientes: pendientes,
                      cups: e.cups

                    }
                    this.espacios.push(objeto)
                  }
                }
              }
            }
            if (this.espacios.length > 0) {
              this.currentTabId = 2;
              this.tabs[0].completed = true;
              this.updatePagedData();
            } else {
              this.modalService.openStatusMessage('Aceptar', 'No existen agendas disponibles para el elemento o especialidad ingresada', '3')
            }


          } else {
            this.modalService.openStatusMessage('Aceptar', 'No existen agendas disponibles para el elemento o especialidad ingresada', '3')
          }
          this.loaderSvc.hide()
        } catch (error: any) {
          console.error(error)
          this.modalService.openStatusMessage('Aceptar', error.message, '3')
          this.loaderSvc.hide()
        }

      } else {
        this.modalService.openStatusMessage('Aceptar', 'Debe seleccionar un elemento o una especialidad', '3')
      }


    } else {
      this.formulario.markAllAsTouched();
    }

  }

  async modalExamenesPorElemento(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {
    this.listaIdExamenesSelected = [];
    const idExamenes = this.formulario.get('listIdExamens')?.value;
    await this.getListaExamenes(idExamenes!);

    if (!this.listaExamenesPorElementos.length) {
      this.modalService.openStatusMessage('Cancelar', 'Lo sentimos, la caracteristica seleccionada no cuenta con elementos, por favor elija otra caracteristica', '4');
      return
    }
    this.buscarMayorCoincidencia(idExamenes!);
    this.contieneTodosExamenes2();

    const destroy$: Subject<boolean> = new Subject<boolean>();
    const data: ModalData = {
      content: template,
      btn: 'Siguiente',
      btn2: 'Cancelar',
      footer: true,
      title: titulo,
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: '31.6em', width: '70em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      const mssError = 'El elemento no contiene todos los examenes, se retirara el check del examen ya que no puede agendar en dos elementos diferentes a la vez, por lo que deberia realizar otro agendamiento con los examenes restantes y se le orientará en todo el proceso'
      if (!this.listaExamenesPorElementosSelected) {
        this.modalService.openStatusMessage('Cancelar', 'Elija un elemento', '4');
        return
      }

      if (idExamenes) {
        if (!this.contieneTodosExamenes(this.listaExamenesPorElementosSelected.listExamDetail)) {
          idExamenes.forEach(x => {
            let ch = this.checkeds.find(g => g.id === x + 'check');
            let arrIdsExam = this.listaExamenesPorElementosSelected.listExamDetail.map(y => y.idExam === x);
            if (arrIdsExam.includes(true)) {
              if (ch) ch.checked = true;
              this.checkExamenesModal(true, Number(x));
            } else {
              if (ch) ch.checked = false;
              this.checkExamenesModal(false, Number(x));
            }
          });
          return this.modalService.openStatusMessage('Cancelar', mssError, '3', undefined, '40em');
        }



        this.formulario.get('idElement')?.setValue(this.listaExamenesPorElementosSelected.idElement);
        let pendientes: any = [];
        if (this.listaExamenesPorElementosSelected && this.listaExamenesPorElementosSelected.listExamDetail.length) {
          let examenesElemento = this.listaExamenesPorElementosSelected.listExamDetail;
          pendientes = this.listaExamenes2.filter(exam2 =>
            !examenesElemento.some(examen => examen.idExam == exam2.idExam) && this.noContieneExamen(exam2.idExam)
          );
        }
        this.buscar(pendientes);
      }

      dialogRef.close();
    });
  }



  generarCreatininaItem(item: any, specialConditionName: string) {

    return {
      nephroprotection: item.nephroprotection,
      idOperatorMin: item.idOperatorMin,
      valuesMin: item.valuesMin,
      idOperatorInter: item.idOperatorInter,
      valuesInter1: item.valuesInter1,
      valuesInter2: item.valuesInter2,
      idOperatorMax: item.idOperatorMax,
      valuesMax: item.valuesMax,
      maximumTime: item.maximumTime,
      observations: item.observations,
      specialConditionName
    }

  }

  cualcularTiempo(tiempoInicial: string, tiempoFinal: string) {

    const [horaInicial, minutoInicial, segundoInicial] = tiempoInicial.split(':').map(Number);
    const [horaFinal, minutoFinal, segundoFinal] = tiempoFinal.split(':').map(Number);
    const minutosInicial = horaInicial * 60 + minutoInicial + segundoInicial / 60;
    const minutosFinal = horaFinal * 60 + minutoFinal + segundoFinal / 60;
    const diferenciaMinutos = minutosFinal - minutosInicial;
    return Math.max(diferenciaMinutos, 0);
  }

  generarDetalle() {

    let titles = [];
    let sub = [];
    if (this.formBackup) {

      let e = { ...this.formBackup }
      try {
        titles.push('Pais')
        sub.push(this.paises.find(p => p.idCountry == e.idCountry).country)

        sub.push(this.departamentos.find(p => p.idDepartment == e.idDepartment).department)
        titles.push('Departamento')

        sub.push(this.cuidades.find(p => p.idCity == e.idCity).city)
        titles.push('Ciudad')

        sub.push(e.idSpecialties ? this.especialidades.find(p => p.idSpecialties == e.idSpecialties).specialtiesName : 'Sin selección')
        titles.push('Especialidad')

        sub.push(this.elementos?.find(p => p.idElement == e.idElement)?.elementName || 'Sin selección')
        titles.push('Elemento')

        sub.push(e.desiredDate ? this.datePipe.transform(e.desiredDate, 'fullDate') : 'Sin selección');
        titles.push('Fecha deseada')

        sub.push(e.idTypeAttention ? this.tiposAtencion.find(p => p.id == e.idTypeAttention).name : 'Sin selección')
        titles.push('Tipo de atención')


        this.headers = [...titles]
        this.subHeaders = [...sub]


      } catch (error) {
        this.modalService.openStatusMessage('Aceptar', 'Error al cargar tarjeta de información', '3')
      }

    }


  }




  agendar(item: any, template: TemplateRef<any> | undefined, titulo: string = '', mensaje: string = '') {
    if (!this.permisosDelModulo.Crear) {
      this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para crear reservas', '3')
      return
    }

    if (this.fv.idElement) {
      item.specialConditionName = this.elementos.find(x => x.idElement == this.fv.idElement).specialConditionName
    }
    if (!item.estado) {
      const destroy$: Subject<boolean> = new Subject<boolean>();
      /* Variables  recibidas por el modal */
      const data: ModalData = {
        content: template,
        btn: 'Aceptar',
        btn2: 'Cancelar',
        footer: true,
        title: titulo,
        type: '2',
        message: 'El tiempo que se dispone no es el que se necesita y puede estar muy ajustado para el paciente. ¿Esta seguro de que desea reservar en este espacio limitado?',
        image: ''
      };
      const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

      dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(_x => {
        this.agendarEspacio = true;
        this.itemAgenda = [item]
        this.cargarDataGeneral()
        this.Nephroprotection = item.creatinina
        dialogRef.close();
      });
    } else {
      this.agendarEspacio = true;
      this.itemAgenda = [item]
      this.Nephroprotection = item.creatinina
      this.cargarDataGeneral()

    }
  }


  cargarDataGeneral() {
    this.dataGeneral = {
      paises: this.paises,
      departamentos: this.departamentos,
      cuidades: this.cuidades,
      sedes: this.sedes,
      categorias: this.categorias,
      especialidades: this.especialidades,
      caracteristicas: this.caracteristicas,
      elementos: this.elementos,
      condicionesEspeciales: this.condicionesEspeciales,
      tiposAtencion: this.tiposAtencion,
      espacios: this.espacios,
    };

  }


  cancelarAgendamiento() {
    this.agendarEspacio = false;
    this.dataGeneral = {};
    setTimeout(() => {
      this.ajustarAlto()
    }, 100);
  }

  cancelarAgendamientoConPendientes(pendientes: any) {
    this.agendarEspacio = false;

    this.currentTabId = 1;
    this.listaExamenes = this.listaExamenes.map(e => {
      if (pendientes.pendientes.find((s: any) => s.idExam == e.idExam)) {
        e.checked = true;
      } else {
        e.checked = false;
      }

      return e

    })
    this.listaIdExamenesSelected = [];
    this.fc.listIdExamens.reset();
    let exams = pendientes.pendientes.map((e: any) => { return e.idExam })
    this.fc.listIdExamens.setValue(exams)
    this.modalExamenesPorElemento(this.ExamenesPorElementoTemplate)
    this.paciente = pendientes.infoPaciente;
    this.formRemitido = pendientes.formRemitido;
    this.pacienteParticularFlag = pendientes.pacienteParticularFlag

  }







  cancelar() {

    this.tabs[0].completed = false;
    this.currentTabId = 1;
    const valueAnterior = JSON.parse(JSON.stringify({ ...this.formulario.getRawValue() }));
    this.formulario.enable({ onlySelf: true });
    //this.formulario.setValue(valueAnterior);

    this.fc.idCountry.setValue(valueAnterior.idCountry);
    this.fc.idDepartment.setValue(valueAnterior.idDepartment);
    this.fc.idTypeAttention.setValue(valueAnterior.idTypeAttention);
    this.fc.idAttentionCenter.setValue(valueAnterior.idAttentionCenter);


    // this.fc.idCharacteristic.reset();
    // this.fc.idSpecialties.reset();
    // this.fc.idElement.reset();


    this.formulario.get('creatinineResultDate')?.clearValidators();
    this.formulario.get('creatinineResult')?.clearValidators();
    this.formulario.updateValueAndValidity();
    this.currentIdCategory = this.formBackup.idCategory
    this.currentIdCity = this.formBackup.idCity
    this.currentIdCharacteristic = this.formBackup.idCharacteristic
    this.currentIdSpecialties = this.formBackup.idSpecialties
    this.currentIdElement = this.formBackup.idElement

    setTimeout(() => {
      // this.formulario.patchValue(
      //   this.formBackup
      // )
      this.formBackup = undefined
    }, 100);
    if (valueAnterior) {
      this.formBackup = valueAnterior;
    }
  }

  updatePagedData() {
    const start = (this.p - 1) * this.paginadorNumber;
    const end = start + this.paginadorNumber;
    this.pagedData = this.espacios.slice(start, end);


  }

  handlePageChange(event: number) {
    this.p = event;
    this.updatePagedData();
  }

  validarObligatoriedadElemento(idCategory: any) {
    let categoria = this.categorias.find(e => e.idCategory == idCategory);
    if (categoria && (categoria.requireElements || categoria.associatedExam)) {
      this.fc.idElement.addValidators(Validators.required);
    } else {
      this.fc.idElement.clearValidators();
    }
    this.fc.idElement.updateValueAndValidity()
  }



}
