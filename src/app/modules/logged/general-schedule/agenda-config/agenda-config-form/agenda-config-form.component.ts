import {
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { Component, ElementRef, HostListener, Renderer2 } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { ConfigAgendaService } from '@app/services/servicios-agendamiento/config-agenda/config-agenda.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { MatRadioModule } from '@angular/material/radio';
import { debounceTime, lastValueFrom, range } from 'rxjs';
import moment from 'moment';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { JsonPipe } from '@angular/common';



@Component({
  selector: 'app-agenda-config-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BasicInputComponent,
    MatTooltipModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
    MatRadioModule
  ],
  templateUrl: './agenda-config-form.component.html',
  styleUrl: './agenda-config-form.component.scss',
})
export class AgendaConfigFormComponent {
  isEdit: boolean = false;
  permisosDelModulo: any;

  idAgenda: number = 0;
  actualAgenda: any = {};

  formulario = this.fb.group({
    idCountry: ['', Validators.required],
    idDepartment: ['', Validators.required],
    idCity: ['', Validators.required],
    idAttentionCenter: ['', Validators.required],
    idCategory: ['', Validators.required],
    idSpecialties: ['', Validators.required],
    idCharacteristic: ['', Validators.required],
    idElement: [[]],
    condicion: [''],
    idTypeAttention: [[], Validators.required],
    // creatinineRequest: [false, Validators.required]
  });

  currentConfigurationTotal: any = null;
  currentCity: string | null = null;
  currentCategory: string | null = null;
  currentDepartament: string | null = null;
  currentEspeciality: string | null = null;
  currentCaracteristic: string | null = null;
  currentElements: any | null = null;
  currentSede: any | null = null;
  tieneAgendas: boolean = false;
  tieneProximasAgendas: boolean = false;

  arregloElementos: any[] = [];

  horarioAtencionForm = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    todos: [false, Validators.required],
    lunes: [false, Validators.required],
    martes: [false, Validators.required],
    miercoles: [false, Validators.required],
    jueves: [false, Validators.required],
    viernes: [false, Validators.required],
    intermediate: [false, Validators.required],
    fromInter: [''],
    untilInter: [''],
  });

  diasSeleccionados: string = '';
  fechaMinima = new Date();
  fechaMinimaFinal = new Date();
  fechaMinima1: Date | null = null;
  fechaMaxima1: Date | null = null;

  fechaMinimaVip: Date | null = new Date();

  horarioBloqueoform = this.fb.group({
    blockDate: [''],
    blockType: [''],
    startTime: [''],
    endTime: [''],
  });

  arregloFechasBloqueadas: any[] = [];
  idIncrementable: any = 0;

  horarioVipform = this.fb.group({
    procedencia: [''],
    startDate: [''],
    endDate: [''],
    startTime: [''],
    endTime: [''],
  });
  horarioEspecialForm = this.fb.group({
    specialHour: [['']],
    startTime: [''],
    endTime: [''],
    hasIntermedial: [false],
    fromInter: [''],
    endInter: [''],

  });



  fechasVIPTodas: any[] = [];
  fechasVIPSoloVisual: any[] = [];


  horariosEspeciales: any[] = [];



  departamentos: any[] = [];
  cuidades: any[] = [];
  paises: any[] = [];
  sedes: any[] = [];
  categorias: any[] = [];
  espacialidades: any[] = [];
  caracteristicas: any[] = [];
  elementos: any[] = [];
  condicionesEspeciales: any[] = [];
  procedencias: any[] = [];

  specialsHoursList: any[] = [];
  specialsHoursListCopy: any[] = [];

  specialHourElementEdit: any = undefined

  tiposAtencion: any[] = [
    { id: 1, name: 'Presencial', checked: false },
    { id: 2, name: 'Virtual', checked: false },
  ];
  espacios: any[] = [];
  dataBlockTable: any[] = [];
  selectedTabIndex: number = 0;

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  showElements: boolean = false;
  flagContentExams: boolean = false;

  //Arreglo para guardar las fechas de agendas futuras
  busyDates: any[] = [];

  constructor(
    private loaderSvc: LoaderService,
    private router: Router,
    private modalSvc: ModalService,
    private configAgendaSVC: ConfigAgendaService,
    private fb: FormBuilder,
    private shadedSVC: SharedService,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private dialog: MatDialog,
    private activateR: ActivatedRoute,
    private tzs: TrazabilidadService,
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo(
      'Configuración de agenda'
    );

    this.activateR.params.subscribe((params) => {
      let idAgenda = params['idAgenda'];
      if (idAgenda) {
        this.idAgenda = Number(idAgenda);
        this.isEdit = true;
        if (!this.permisosDelModulo.Editar) {
          this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
          this.cancelar();
        }
      }
    });
  }

  get fv() {
    return this.formulario.value;
  }
  get fc() {
    return this.formulario.controls;
  }
  get fv1() {
    return this.horarioAtencionForm.value;
  }
  get fc1() {
    return this.horarioAtencionForm.controls;
  }
  get fv2() {
    return this.horarioBloqueoform.value;
  }
  get fc2() {
    return this.horarioBloqueoform.controls;
  }
  get fv3() {
    return this.horarioVipform.value;
  }
  get fc3() {
    return this.horarioVipform.controls;
  }
  get fv4() {
    return this.horarioEspecialForm.value;
  }
  get fc4() {
    return this.horarioEspecialForm.controls;
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto();
    }, 100);
  }

  ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.title').offsetHeight;

    let he = (container - header) / 2;
    const title = this.elRef.nativeElement.querySelector('.content-form').offsetHeight;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.content-form'), 'height', `${he - 130}px`);

    if (title) {
      switch (this.selectedTabIndex) {
        case 0:
          this.renderer.setStyle(this.elRef.nativeElement.querySelector('.content-tabs'), 'height', `${he - 45}px`);
          break;
        case 1:
          this.renderer.setStyle(
            this.elRef.nativeElement.querySelector('.segundo-tab'), 'height', `${he - 45}px`); break;
        case 2:
          this.renderer.setStyle(this.elRef.nativeElement.querySelector('.tercer-tab'), 'height', `${he - 45}px`);
          break;
        case 3:
          this.renderer.setStyle(this.elRef.nativeElement.querySelector('.cuarto-tab'), 'height', `${he - 45}px`);
          break;

        default:
          break;
      }
    }
  }

  async ngOnInit(): Promise<void> {
    await this.getCountries();
    this.filtrosInputs();
    this.filtroElementos();
    this.filtroTab1();
    this.filterTab2();
    this.filterVipInputs
    this.filterFechaBloqueo();
    this.filterVipInputs();
    await this.getDaysSPecials();
    await this.getConfiguracion();
    await this.getCategory();
    await this.getCondiciones();
    await this.getProcedencias();
    this.ajustarAlto();
  }

  filtrosInputs() {
    this.fc.idCountry.valueChanges.subscribe(async (p) => {
      if (p) {
        await this.getDepartaments(Number(p));
      }
    });
    this.fc.idDepartment.valueChanges.subscribe(async (p) => {
      if (p) {
        await this.getCities(Number(p));
      }
    });
    this.fc.idCity.valueChanges.subscribe(async (p) => {
      if (p) {
        await this.getSedes(Number(p));
      }
    });
    this.fc.idCategory.valueChanges.subscribe(async (p) => {
      if (p) {
        await this.getEspecialidad(Number(p));
        this.validarObligatoriedadElemento(p);
      }
    });
    this.fc.idSpecialties.valueChanges.subscribe(async (p) => {
      if (p) {
        await this.getCaracteristicas(Number(p));
      }
    });
    this.fc.idCharacteristic.valueChanges.subscribe(async (p) => {
      if (p) {
        await this.getElementos(Number(p));
      }
    });
  }

  filtroTab1() {
    this.fc1.startDate.valueChanges.subscribe((e: any) => {
      if (e) {
        this.fechaMinima1 = new Date(e);
      }
    });
    this.fc1.endDate.valueChanges.subscribe((e: any) => {
      if (e) {
        this.fechaMaxima1 = new Date(e);
      }
    });
  }


  filtroElementos() {
    this.fc.idElement.valueChanges.subscribe((p: any) => {
      this.arregloElementos = [];
      this.elementos.forEach((element) => {
        element.checked = false;
      });
      if (p && p != '' && p.length) {
        for (const e of p) {
          let obj = {
            idElement: e,
            active: true,
          };
          let elem = this.elementos.find((s) => s.idElement == e);
          if (elem) {
            elem.checked = true;
          }
          this.arregloElementos.push(obj);
        }
      }
    });
  }

  async getConfiguracion() {
    if (this.isEdit && this.idAgenda) {
      try {
        this.loaderSvc.show();
        this.loaderSvc.text.set({ text: 'Cargando agenda' });
        let items = await lastValueFrom(this.configAgendaSVC.getAgendaId(this.idAgenda))
        this.loaderSvc.hide();
        if (items.ok) {
          this.tieneAgendas = false;
          this.actualAgenda = items.data;

          this.montarConfiguracion(items.data, items.data.generalDetails.haveNextAppointments || false);
          if (items.data.generalDetails.isUsed) {


            this.fc.idCountry.disable()
            this.fc.idDepartment.disable()
            this.fc.idCity.disable()
            this.fc.idAttentionCenter.disable()
            this.fc.idCategory.disable()
            this.fc.idSpecialties.disable()
            this.fc.idCharacteristic.disable()
            this.fc.condicion.disable()


            this.tieneAgendas = true;
            this.tieneProximasAgendas = false;
            if (items.data.generalDetails.haveNextAppointments) {
              this.generateArrayDatesBusy(items.data.nextAppointments)
              this.tieneProximasAgendas = true;
              this.fc.idTypeAttention.disable()
              this.fc.idElement.disable()
            }
          }
        }
      } catch (error) {
        this.loaderSvc.hide();
        console.error(error)
      }
    }
  }

  //Funcionalidad para guardar las fechas futuras si la agenda ya esta con reservas

  generateArrayDatesBusy(proxFechas: any[]) {
    //const uniqueDates = [...new Set(proxFechas.map(item => new Date(item.desiredDate)))];
    this.busyDates = proxFechas.map(e => {
      let fecha = new Date(e.desiredDate);
      let diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado

      let obj = {
        fecha: fecha,
        festivo: e.holiday || false,
        horaInicial: e.startTime.slice(0, -3),
        horaFinal: e.endTime.slice(0, -3),
        dia: diaSemana === 6 ? 1 : diaSemana === 0 ? 2 : 0 // 1 = Sábado, 2 = Domingo, 0 = Otro día
      };

      return obj;
    });

  }

  montarConfiguracion(configuracion: any, ProxAgenda: boolean) {
    //?Primer formulario
    this.currentConfigurationTotal = configuracion;
    let g = configuracion.generalDetails;

    this.currentCity = g.idCity;
    this.currentCategory = g.idCategory;
    this.currentDepartament = g.idDepartment;
    this.currentEspeciality = g.idSpecialties;
    this.currentCaracteristic = g.idCharacteristic;

    (this.currentElements = g.elements),
      (this.currentSede = g.idAttentionCenter),
      this.formulario.patchValue({
        idCountry: g.idCountry,
        // creatinineRequest: g.creatinineRequest || false,
      });
    let tipoDeAtencionArray: any = g.idTypeAttention.split(',');
    if (tipoDeAtencionArray.length > 0) {
      for (let i of tipoDeAtencionArray) {
        let tipo = this.tiposAtencion.find((e) => e.id == i);
        if (tipo) {
          tipo.checked = true;
        }
      }
      this.fc.idTypeAttention.setValue(
        tipoDeAtencionArray.map((i: any) => {
          i = Number(i);
          return i;
        })
      );
    }

    //?Segundo formulario primer tab

    let d = configuracion.configurationsDetails;

    const today = new Date();
    const startDate = new Date(d.startDate);

    // Comparar las fechas y asignar la mínima
    this.fechaMinima = startDate > today ? today : startDate;

    this.horarioAtencionForm.patchValue({
      startDate: d.startDate,
      endDate: d.endDate,
      startTime: d.startTime.slice(0, -3),
      endTime: d.endTime.slice(0, -3),
      intermediate: d.intermediate,
    });
    //Cargar los dias de la semana seleccionados

    if (d.daysAttention && d.daysAttention.length) {
      const todosLosDias = [
        'lunes',
        'martes',
        'miercoles',
        'jueves',
        'viernes'
      ];
      const diasArray = d.daysAttention
        .split(',')
        .map((dia: any) => dia.trim());
      if (diasArray.length == 7) {
        this.fc1.todos.setValue(true);
        this.todosDias({ checked: true });
        //Bloquear todos los días cuando ya es usada la agenda
        if (ProxAgenda) {
          this.fc1.lunes.disable();
          this.fc1.martes.disable();
          this.fc1.miercoles.disable();
          this.fc1.jueves.disable();
          this.fc1.viernes.disable();
          this.fc1.todos.disable();
        }

      } else {
        for (const day of diasArray) {
          if (todosLosDias.includes(day)) {
            this.seleccionarUnDia(day, { checked: true });
            this.horarioAtencionForm.patchValue({
              [day]: true,
            });
            if (ProxAgenda) {
              this.horarioAtencionForm.get(day)?.disable();
              this.horarioAtencionForm.get('todos')?.disable();
            }

          }
        }
      }
    }
    //Cargar horas de intermedio
    if (d.intermediate) {
      setTimeout(() => {
        this.horarioAtencionForm.patchValue({
          fromInter: d.fromInter.slice(0, -3),
          untilInter: d.untilInter.slice(0, -3),
        });
      }, 500);
    }

    //?Tercer formulario segundo tab

    let t = configuracion.configurationsDetails.blockingTimes;

    if (t && t.length) {
      this.arregloFechasBloqueadas = [];
      for (const el of t) {
        this.generarItemEnArregloFechasBloqueadas(
          el.blockDate,
          el.blockingDays ? 1 : 2,
          el.blockingDays ? '00:00' : el.startTime,
          el.blockingDays ? '00:00' : el.endTime,
          el.idBlockingSchedule
        );
      }

      this.horarioBloqueoform.patchValue({
        blockDate: t[0].blockDate,
      });

      this.arregloVisibleBloqueados(t[0].blockDate);
    }

    //?Cuarto formulario bloqueos VIP

    let vip = configuracion.configurationsDetails.blockingVip;

    if (vip && vip.length) {
      this.fechasVIPTodas = [];
      for (const el of vip) {
        this.generarArregloVIP(
          el.startDate,
          el.endDate,
          el.startTime,
          el.endTime,
          el.idOriginEntity
        );
      }
      this.fc3.procedencia.setValue(vip[0].idOriginEntity);
      this.arregloVisibleVIP();
    }

    //Montar horarios especiales

    let specials = configuracion.configurationsDetails.specialSchedule;
    if (specials && specials.length) {

      for (const i of specials) {
        this.horariosEspeciales.push({
          idspecialHour: i.idSpecialDay,
          specialHour: this.specialsHoursList.find(e => e.idSpecialDay == i.idSpecialDay).specialDay,
          startTime: i.startTime.slice(0, -3),
          endTime: i.endTime.slice(0, -3),
          fromInter: i.fromInter ? i.fromInter.slice(0, -3) : null,
          endInter: i.endInter ? i.endInter.slice(0, -3) : null,
          hasIntermedial: i.fromInter && i.endInter ? true : false
        })
        this.specialsHoursList = this.specialsHoursList.filter(e => e.idSpecialDay != i.idSpecialDay);
        for (const e of this.specialsHoursList) {
          e.checked = false;
        }
        this.specialHourElementEdit = undefined
      }

    }
  }

  desbloquearInputs() {
    this.fc.idCountry.enable();
    this.fc.idDepartment.enable();
    this.fc.idCity.enable();
    this.fc.idAttentionCenter.enable();
    this.fc.idCategory.enable();
    this.fc.idSpecialties.enable();
    this.fc.idElement.enable();
    this.fc.condicion.enable();
    this.fc.idTypeAttention.enable();
  }

  async getCountries() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando paises' });
      let items = await this.shadedSVC.getCountries().toPromise();
      if (items.data && items.ok) {
        this.paises = items.data;
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getDepartaments(pais: number) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando departamentos' });
      this.fc.idDepartment.setValue('');
      let items = await this.shadedSVC.getDepartaments(pais).toPromise();
      if (items.data && items.ok) {
        this.departamentos = items.data;

        setTimeout(() => {
          if (this.currentDepartament) {
            this.fc.idDepartment.setValue(this.currentDepartament);
            this.currentDepartament = null;
          }
        }, 100);
      }
      this.loaderSvc.hide();
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getCities(department: any) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando cuidades' });
      this.fc.idCity.reset();
      let items = await this.shadedSVC.getCities(department).toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.cuidades = items.data;
        setTimeout(() => {
          if (this.currentCity) {
            this.fc.idCity.setValue(this.currentCity);
            this.currentCity = null;
          }
        }, 100);
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getSedes(idCity: number) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando sedes' });
      this.fc.idAttentionCenter.reset();
      this.sedes = [];
      let items = await this.shadedSVC.getSedesbyCity(idCity).toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.sedes = items.data;
        setTimeout(() => {
          if (this.currentSede) {
            this.fc.idAttentionCenter.setValue(this.currentSede);
            this.currentSede = null;
          }
        }, 10);
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getCategory() {
    try {
      this.loaderSvc.show();
      this.fc.idCategory.reset();
      this.fc.idSpecialties.reset();
      this.fc.idCharacteristic.reset();
      this.fc.idElement.reset();
      this.loaderSvc.text.set({ text: 'Cargando categorias' });
      this.categorias = [];
      this.espacialidades = [];
      this.caracteristicas = [];
      this.elementos = [];
      let items = await this.shadedSVC.getCategory().toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.categorias = items.data;
        setTimeout(() => {
          if (this.currentCategory) {
            this.fc.idCategory.setValue(this.currentCategory);
            this.currentCategory = null;
          }
        }, 100);
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getEspecialidad(idCategory: number) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando especialidades' });
      this.fc.idSpecialties.reset();
      this.fc.idCharacteristic.reset();
      this.fc.idElement.reset();
      this.espacialidades = [];
      this.caracteristicas = [];
      this.elementos = [];
      let items = await this.shadedSVC.getSpecialization(idCategory).toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.espacialidades = items.data;
        setTimeout(() => {
          if (this.currentEspeciality) {
            this.fc.idSpecialties.setValue(this.currentEspeciality);
            this.currentEspeciality = null;
          }
        }, 100);
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getCaracteristicas(idSpeciality: number) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando caracteristicas' });
      this.fc.idCharacteristic.reset();
      this.fc.idElement.reset();
      this.caracteristicas = [];
      this.elementos = [];
      let items = await this.shadedSVC
        .getCharacteristic(idSpeciality)
        .toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.caracteristicas = items.data;
        setTimeout(() => {
          if (this.currentCaracteristic) {
            this.fc.idCharacteristic.setValue(this.currentCaracteristic);
            this.currentCaracteristic = null;
          }
        }, 100);
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getElementos(idCharacteristic: number) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando elementos' });
      this.fc.idElement.reset();
      this.elementos = [];
      let items = await this.shadedSVC
        .getElementos(idCharacteristic)
        .toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.elementos = items.data.map((e: any) => {
          e.checked = false;
          return e;
        });
        setTimeout(() => {
          if (this.currentElements.length) {
            let elementosCargados: any = [];

            for (const el of this.currentElements) {
              if (el && el.active) {
                elementosCargados.push(el.idElement);
              }
            }
            this.fc.idElement.setValue(elementosCargados);
            this.currentElements = null;
          }
        }, 100);
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getCondiciones() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando condiciones especiales' });
      this.condicionesEspeciales = [];
      let items = await this.shadedSVC.getCondicionEspecial().toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.condicionesEspeciales = items.data;
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getProcedencias() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando procedencias' });
      let items = await this.configAgendaSVC.getProcedencias().toPromise();
      this.loaderSvc.hide();
      if (items.ok) {
        this.procedencias = items.data;
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }
  async getDaysSPecials() {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando días especiales' });
      let items = await lastValueFrom(this.configAgendaSVC.getDaysSpecials())
      this.loaderSvc.hide();
      if (items.ok) {
        this.specialsHoursList = items.data.map((x: any) => { x.checked = false; return x })
        this.specialsHoursListCopy = items.data.map((x: any) => { x.checked = false; return x })
      }
    } catch (error) {
      this.loaderSvc.hide();
    }
  }

  cancelar() {
    this.router.navigate(['/inicio/agenda-general/configuracion-agenda']);
  }

  // cambiarEstado($event: any) {
  //   this.fc.creatinineRequest.setValue($event)
  // }

  eliminarRango(item: any) { }
  editRango(item: any) { }

  siguiente(event: number) {

    if (this.horarioAtencionForm.valid) {
      if (!this.diasSeleccionados.length) {
        this.modalSvc.openStatusMessage('Aceptar', 'Debe seleccionar por lo menos un día de la semana', '3')
        return
      }
      this.selectedTabIndex = event;
      setTimeout(() => {
        this.ajustarAlto();
      }, 500);
    } else {
      this.horarioAtencionForm.markAllAsTouched();
    }
  }

  anterior() {
    this.selectedTabIndex--;
    setTimeout(() => {
      this.ajustarAlto();
    }, 500);
  }

  async guardar() {
    if(this.specialHourElementEdit){
      this.modalSvc.openStatusMessage('Aceptar', 'Debe guardar el horario especial para continuar', '3');
      return
    }
    if (
      (this.formulario.valid && this.horarioAtencionForm.valid) ||
      (this.tieneAgendas && this.horarioAtencionForm.valid)
    ) {
      try {
        //Primer formulario
        let primerForm = this.formulario.getRawValue();

        let objeto: any = {
          idAttentionCenter: primerForm.idAttentionCenter,
          idCategory: primerForm.idCategory,
          idSpecialties: primerForm.idSpecialties,
          idCharacteristic: primerForm.idCharacteristic,
          contentExams: this.flagContentExams
        };
        if (primerForm.idElement) {
          objeto.elements = Array.isArray(primerForm.idElement)
            ? primerForm.idElement
            : [primerForm.idElement];
        } else {
          objeto.elements = null;
        }
        if (primerForm.idTypeAttention) {
          let array: any = primerForm.idTypeAttention;
          objeto.idTypeAttention = array.join(',');
        }

        //Segundo formulario

        if (this.fv1.startTime && this.fv1.endTime) {
          const [initialHours, initialMinutes] = this.fv1.startTime
            ?.split(':')
            .map(Number);
          const [finalHours, finalMinutes] = this.fv1.endTime
            ?.split(':')
            .map(Number);

          const initialTotalMinutes = initialHours * 60 + initialMinutes;
          const finalTotalMinutes = finalHours * 60 + finalMinutes;

          if (initialTotalMinutes >= finalTotalMinutes) {
            this.modalSvc.openStatusMessage('Aceptar', 'La hora inicial del rango de horario de agenda debe ser menor que el final', '3');
            return;
          }
        }

        if (
          this.fv1.intermediate &&
          this.fv1.fromInter &&
          this.fv1.untilInter
        ) {
          const [initialHours, initialMinutes] = this.fv1.fromInter
            ?.split(':')
            .map(Number);
          const [finalHours, finalMinutes] = this.fv1.untilInter
            ?.split(':')
            .map(Number);

          const initialTotalMinutes = initialHours * 60 + initialMinutes;
          const finalTotalMinutes = finalHours * 60 + finalMinutes;

          if (initialTotalMinutes >= finalTotalMinutes) {
            this.modalSvc.openStatusMessage('Aceptar', 'La hora inicial del intermedio debe ser menor que el final', '3');
            return;
          }
        }

        objeto.customerService = {
          startDate: this.fv1.startDate,
          endDate: this.fv1.endDate,
          startTime: this.fv1.startTime + ':00',
          endTime: this.fv1.endTime + ':00',
          intermediate: this.fv1.intermediate,
          daysAttention: this.diasSeleccionados,
          fromInter: this.fv1.fromInter
            ? this.fv1.fromInter + ':00'
            : '00:00:00',
          untilInter: this.fv1.untilInter
            ? this.fv1.untilInter + ':00'
            : '00:00:00',
        };

        //Tercer formulario
        if (this.arregloFechasBloqueadas && this.arregloFechasBloqueadas.length) {
          let horariosBloqueados: any = [];
          for (const i of this.arregloFechasBloqueadas) {
            const [day, month, year] = i.blockDate.split('/');
            const formattedDate = `${year}-${month.padStart(
              2,
              '0'
            )}-${day.padStart(2, '0')}`;
            let obj: any = {
              blockDate: new Date(formattedDate),
              startTime: i.type == 2 ? i.startTime : '00:00:00',
              endTime: i.type == 2 ? i.endTime : '00:00:00',
              blockingDays: i.type == 1 ? true : false,
              hourlyBlocking: i.type == 2 ? true : false,
            };
            if (i.idBlockingSchedule) {
              obj.idBlockingSchedule = i.idBlockingSchedule;
            }
            horariosBloqueados.push(obj);
          }
          objeto.blockingSchedules = horariosBloqueados;
        }

        //Cuarto formulario fechas VIP

        if (this.fechasVIPTodas && this.fechasVIPTodas.length) {
          let horariosVIPBloqueados: any = [];
          for (const i of this.fechasVIPTodas) {
            const [day, month, year] = i.startDate.split('/');
            const formattedDate = `${year}-${month.padStart(
              2,
              '0'
            )}-${day.padStart(2, '0')}`;

            const [endday, endmonth, endyear] = i.endDate.split('/');
            const endformattedDate = `${endyear}-${endmonth.padStart(
              2,
              '0'
            )}-${endday.padStart(2, '0')}`;
            let obj: any = {
              startDate: new Date(formattedDate),
              endDate: new Date(endformattedDate),
              startTime: i.startTime,
              endTime: i.endTime,
              idOriginEntity: i.idOriginEntity,
              specialSchedule: false,
              idSpecialDay: null
            };

            horariosVIPBloqueados.push(obj);
          }
          objeto.vipBlockings = horariosVIPBloqueados;
        }

        //Quinto formulario, horarios especiales, es de tener en cuenta que los horarios especiales quedan dentro de horarios VIP


        if (this.horariosEspeciales && this.horariosEspeciales.length) {
          let horariosCopy: any = []
          if (objeto.vipBlockings && objeto.vipBlockings.length) {

            horariosCopy = [...objeto.vipBlockings]
          }

          for (const i of this.horariosEspeciales) {
            let obj: any = {
              startDate: this.fv1.startDate,
              endDate: this.fv1.endDate,
              startTime: i.startTime + ':00',
              endTime: i.endTime + ':00',
              idOriginEntity: null,
              origin: null,
              specialSchedule: true,
              idSpecialDay: i.idspecialHour,
              fromInter: i.hasIntermedial ? i.fromInter + ':00' : null,
              endInter: i.hasIntermedial ? i.endInter + ':00' : null
            };
            horariosCopy.push(obj);
          }
          objeto.vipBlockings = horariosCopy;

        }

        if (this.isEdit) {
          objeto.idAgenda = this.idAgenda;
        }

        this.loaderSvc.show();
        this.loaderSvc.text.set({ text: 'Guardando configuación' });
        let r: any;
        if (!this.isEdit) {
          r = await lastValueFrom(
            this.configAgendaSVC.createConfigAgenda(objeto)
          );
        } else {
          r = await lastValueFrom(
            this.configAgendaSVC.UpdateAgendaConfig(objeto)
          );
        }

        this.loaderSvc.hide();
        if (r.ok) {
          this.modalSvc.openStatusMessage('Aceptar', `¡Configuración de agenda ${this.isEdit ? 'actualizada' : 'creada'} en el sistema correctamente!`, '1');
          this.trazabilidadGuardarEditar(objeto)
          this.cancelar();

        } else {
          this.modalSvc.openStatusMessage('Aceptar', r.message, '3');
        }
      } catch (error: any) {
        this.loaderSvc.hide();
        this.modalSvc.openStatusMessage('Aceptar', error.message, '3');
      }
    } else {
      this.formulario.markAllAsTouched();
      this.horarioAtencionForm.markAllAsTouched();
    }
  }

  // Funcionalidades de validaciones

  filterTab2() {
    this.fc1.intermediate.valueChanges.subscribe((e) => {
      if (e == true) {
        this.fc1.untilInter.setValidators([Validators.required]);
        this.fc1.untilInter.updateValueAndValidity();
        this.fc1.fromInter.setValidators([Validators.required]);
        this.fc1.fromInter.updateValueAndValidity();
      } else {
        this.fc1.untilInter.clearValidators();
        this.fc1.untilInter.updateValueAndValidity();
        this.fc1.fromInter.clearValidators();
        this.fc1.fromInter.updateValueAndValidity();
      }
    });
  }
  todosDias(event: any) {
    const isChecked = event.checked;
    const todosLosDias = [
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
    ];

    if (isChecked) {
      // Si se selecciona "Todos", añade todos los días al string.
      this.diasSeleccionados = todosLosDias.join(', ');
    } else {
      // Si se desmarca "Todos", limpia el string de días.
      this.diasSeleccionados = '';
    }

    // Actualizar el formulario para reflejar la selección de todos los días.
    this.horarioAtencionForm.patchValue({
      lunes: isChecked,
      martes: isChecked,
      miercoles: isChecked,
      jueves: isChecked,
      viernes: isChecked
    });
  }

  seleccionarUnDia(dia: string, event: any) {
    const isChecked = event.checked;
    const todosLosDias = [
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes'
    ];

    // Obtén un arreglo de los días seleccionados actuales.
    let diasArray = this.diasSeleccionados
      ? this.diasSeleccionados.split(', ')
      : [];

    // Agregar o quitar el día según el estado del checkbox.
    if (isChecked && !diasArray.includes(dia)) {
      diasArray.push(dia);
    } else if (!isChecked) {
      diasArray = diasArray.filter((d) => d !== dia);
    }

    // Ordenar los días seleccionados en el orden correcto.
    diasArray.sort((a, b) => todosLosDias.indexOf(a) - todosLosDias.indexOf(b));
    this.diasSeleccionados = diasArray.join(', ');

    // Desmarcar el checkbox de "Todos" si se selecciona/deselecciona un día.
    this.horarioAtencionForm.patchValue({
      todos: false,
    });
  }

  filterFechaBloqueo() {
    this.fc2.blockDate.valueChanges.subscribe((r) => {
      if (r) {
        this.arregloVisibleBloqueados(r);
      }
    });
  }

  agregarHorarioBloqueo() {
    if (this.fv2.blockDate && this.fv2.blockType) {

      if (this.fv2.blockType == '2' && this.fv2.startTime && this.fv2.endTime) {
        const [initialHours, initialMinutes] = this.fv2.startTime
          ?.split(':')
          .map(Number);
        const [finalHours, finalMinutes] = this.fv2.endTime
          ?.split(':')
          .map(Number);

        const initialTotalMinutes = initialHours * 60 + initialMinutes;
        const finalTotalMinutes = finalHours * 60 + finalMinutes;

        if (initialTotalMinutes >= finalTotalMinutes) {
          this.modalSvc.openStatusMessage('Aceptar', 'La hora inicial debe ser menor a la hora final ', '3');
          return;
        }
      }

      if (this.fv2.blockType == '2' && !(this.fv2.startTime && this.fv2.endTime)) {
        this.modalSvc.openStatusMessage('Aceptar', 'Debe ingresar las horas de bloqueo', '3');
        return;
      }
      if (this.dataBlockTable.length && this.fv2.blockType == '2') {
        if (this.dataBlockTable.find((s: any) => s.startTime == '-')) {
          this.modalSvc.openStatusMessage('Aceptar', 'Esta fecha se encuentra bloqueada todo el día', '3');
          return;
        }
      }
      if (this.dataBlockTable.length && this.fv2.blockType == '1') {
        this.modalSvc.openStatusMessage('Aceptar', 'La fecha seleccionada ya cuenta con horarios de bloqueo', '3');
        return;
      }

      //Revisamos si ya hay agendas futuras asignadas y nos traemos esas fehcas
      let datesNoAvailable = [];

      if (this.busyDates.length) {
        datesNoAvailable = this.busyDates.filter(e =>
          e.fecha && this.fv2.blockDate &&
          new Date(e.fecha).toISOString().split('T')[0] === new Date(this.fv2.blockDate).toISOString().split('T')[0]
        );
      }
      //Validamos si ya hay una agenda para esta fecha en caso de que sea bloqueo todo el dia
      if (this.fv2.blockType == '1' && datesNoAvailable.length) {
        this.modalSvc.openStatusMessage('Aceptar', 'La fecha de bloqueo coincide con una reserva o cita existente.', '3');
        return;
      }

      //Validacion para saber si las horas bloqueadas estan en el rango del horario establecido

      if (this.fv1.startTime && this.fv1.endTime && this.fv2.startTime && this.fv2.endTime && this.fv2.blockType == '2') {
        const [horaInicial, minutosInicial] = this.fv1.startTime?.split(':').map(Number);
        const [horaFinal, minutosFinal] = this.fv1.endTime?.split(':').map(Number);
        const [horaInicialBloqueo, minutoInicialBloqueo] = this.fv2.startTime?.split(':').map(Number);
        const [horaFinalBloqueo, minutoFinalBloqueo] = this.fv2.endTime?.split(':').map(Number);

        const initialTotalMinutesBlock = horaInicialBloqueo * 60 + minutoInicialBloqueo;
        const finalTotalMinutesblock = horaFinalBloqueo * 60 + minutoFinalBloqueo;
        const horarioMinutosInicial = horaInicial * 60 + minutosInicial;
        const horarioMinutosFinal = horaFinal * 60 + minutosFinal;

        if (horarioMinutosInicial > initialTotalMinutesBlock || horarioMinutosFinal < finalTotalMinutesblock) {
          this.modalSvc.openStatusMessage('Aceptar', 'El horario de bloqueo debe estar en los rangos de horarios de agenda seleccionados', '3');
          return;
        }
        // Ahora validamos si la hora del bloqueo no coincide con una hora de cita ya programada
        if (datesNoAvailable.length) {
          for (const cita of datesNoAvailable) {
            const [horaInicialCita, minutoInicialCita] = cita.horaInicial.split(':').map(Number);
            const [horaFinalCita, minutoFinalCita] = cita.horaFinal.split(':').map(Number);

            const minutosTotalesInicialCita = horaInicialCita * 60 + minutoInicialCita;
            const minutosTotalesFinalCita = horaFinalCita * 60 + minutoFinalCita;

            if (
              (initialTotalMinutesBlock >= minutosTotalesInicialCita && initialTotalMinutesBlock < minutosTotalesFinalCita) ||
              (finalTotalMinutesblock > minutosTotalesInicialCita && finalTotalMinutesblock <= minutosTotalesFinalCita) ||
              (initialTotalMinutesBlock <= minutosTotalesInicialCita && finalTotalMinutesblock >= minutosTotalesFinalCita)
            ) {
              this.modalSvc.openStatusMessage('Aceptar', 'El horario de bloqueo coincide con una reserva o cita existente.', '3');
              return;
            }

          }
        }

      }

      if (this.fv2.blockDate != undefined) {
        let fecha: any = this.fv2.blockDate
        let fechaFormat = this.formatDate(fecha);
        let objetosConMismaFecha = this.arregloFechasBloqueadas.filter((item) => {
          return item.blockDate == fechaFormat
        });

        if (objetosConMismaFecha.length) {
          if (this.fv2.startTime && this.fv2.endTime) {
            let [horaInicial, minutosInicial] = this.fv2.startTime
              ?.split(':')
              .map(Number);
            let [horaFinal, minutosFinal] = this.fv2.endTime
              ?.split(':')
              .map(Number);
            const minutosNuevosInicial = horaInicial * 60 + minutosInicial;
            const minutosNuevosFinal = horaFinal * 60 + minutosFinal;

            let yaExiste = false;
            let mensaje = ''
            for (const element of objetosConMismaFecha) {
              let [inicio, minutosInicio] = element.startTime
                ?.split(':')
                .map(Number);
              let [fin, minutosfin] = element.endTime?.split(':').map(Number);
              const minutosEstablecidoInicial = inicio * 60 + minutosInicio;
              const minutosEstablecidoFinal = fin * 60 + minutosfin;
              if (
                minutosNuevosInicial == minutosEstablecidoInicial || minutosNuevosFinal == minutosEstablecidoFinal ||
                (minutosNuevosInicial > minutosEstablecidoInicial && minutosNuevosInicial < minutosEstablecidoFinal) ||
                (minutosNuevosFinal > minutosEstablecidoInicial && minutosNuevosFinal < minutosEstablecidoFinal)
              ) {
                yaExiste = true;
                mensaje = 'Los rangos de tiempo ingresados ya existen o estan dentro de un bloqueo ya ingresado para esta fecha';
                break
              } else if (minutosNuevosInicial < minutosEstablecidoInicial && minutosNuevosFinal > minutosEstablecidoFinal) {
                yaExiste = true;
                mensaje = 'Los rangos de tiempo ingresados se sobreponen a un rango de tiempo ya ingresado para esta fecha';
                break
              }
            }

            if (yaExiste) return this.modalSvc.openStatusMessage('Aceptar', mensaje, '4');
          }
        }

      }

      this.generarItemEnArregloFechasBloqueadas(
        this.fv2.blockDate,
        this.fv2.blockType,
        this.fv2.blockType == '2' ? this.fv2.startTime + ':00' : '-',
        this.fv2.blockType == '2' ? this.fv2.endTime + ':00' : '-'
      );
      this.arregloVisibleBloqueados(this.fv2.blockDate);
      this.modalSvc.openStatusMessage('Aceptar', 'Horario de bloqueo agregado', '1');
      this.horarioBloqueoform.patchValue({ blockType: '', startTime: '', endTime: '', });
    } else {
      this.modalSvc.openStatusMessage('Aceptar', 'Debe ingresar los datos completos', '3');
    }
  }

  generarItemEnArregloFechasBloqueadas(
    date: any,
    type: any,
    startTime: any,
    endTime: any,
    idBlockingSchedule?: any
  ) {
    let obj: any = {
      id: this.idIncrementable,
      idBlockingSchedule: idBlockingSchedule ? idBlockingSchedule : null,
      blockDate: this.formatDate(date),
      type: type,
      startTime: startTime,
      endTime: endTime,
    };
    this.arregloFechasBloqueadas.push(obj);
    this.idIncrementable++;
  }

  arregloVisibleBloqueados(date: string) {

    let fecha = this.formatDate(date);
    let i = 0;

    this.dataBlockTable = [];
    let arreglo = this.arregloFechasBloqueadas.filter((item) => {
      const itemDate = item.blockDate;
      if (item.startTime == '00:00:00' && item.endTime == '00:00:00') {
        item.startTime = '-';
        item.endTime = '-';
      }
      item.id = i;
      i++;
      return itemDate === fecha;
    });

    this.dataBlockTable = arreglo;
  }

  formatDate(dateStr: string): string {
    return moment(dateStr).format('l');
  }

  eliminarHorarioBloqueo(id: any) {
    this.arregloFechasBloqueadas = this.arregloFechasBloqueadas.filter(
      (e: any) => e.id != id
    );
    this.dataBlockTable = this.dataBlockTable.filter((e: any) => e.id != id);
  }

  editarHorarioBloqueo(id: any) {
    let item = this.dataBlockTable.find((e: any) => e.id == id);
    if (item) {
      this.fc2.blockType.setValue(String(item.type));
      setTimeout(() => {
        this.fc2.startTime.setValue(item.startTime.slice(0, -3));
        this.fc2.endTime.setValue(item.endTime.slice(0, -3));
        this.arregloFechasBloqueadas = this.arregloFechasBloqueadas.filter(
          (e: any) => e.id != id
        );
        this.dataBlockTable = this.dataBlockTable.filter(
          (e: any) => e.id != id
        );
      }, 200);
    }
  }

  agregarVIPBloqueo() {
    if (
      this.fv3.startDate &&
      this.fv3.endDate &&
      this.fv3.procedencia &&
      this.fv3.endTime &&
      this.fv3.startTime
    ) {
      //Validar que ese dato bloqueado ya no existe en la tabla
      let listCoincidencias = this.fechasVIPSoloVisual.filter(
        (e) => this.fv3.procedencia == e.idOriginEntity
      );
      if (listCoincidencias) {
        let dateInit = this.formatDate(this.fv3.startDate);
        let dateFinal = this.formatDate(this.fv3.endDate);
        let horaInicial = this.fv3.startTime + ':00';
        let horaFinal = this.fv3.endTime + ':00';
        let coincidencia = listCoincidencias.find((item: any) => {
          // Agregar return aquí

          //Convertir las fechas de string a date para poder compararlas
          const fechaFormInicial = new Date(dateInit.split('/').reverse().join('-'));
          const fechaFormFinal = new Date(dateFinal.split('/').reverse().join('-'));
          const fechaItemInicial = new Date(item.startDate.split('/').reverse().join('-'));
          const fechaItemFinal = new Date(item.endDate.split('/').reverse().join('-'));

          return (
            this.fv3.procedencia == item.idOriginEntity &&
            String(dateInit) == String(item.startDate) &&
            String(dateFinal) == String(item.endDate) &&
            String(horaInicial) == String(item.startTime) &&
            String(horaFinal) == String(item.endTime) ||
            (this.fv3.procedencia == item.idOriginEntity && fechaFormInicial >= fechaItemInicial && fechaFormInicial <= fechaItemFinal) ||
            (this.fv3.procedencia == item.idOriginEntity && fechaFormFinal >= fechaItemInicial && fechaFormInicial <= fechaItemFinal)
          );
        });
        if (coincidencia) {
          this.modalSvc.openStatusMessage('Aceptar', 'El bloqueo ingresado ya existe o está dentro de los rangos de una fecha u hora ya establecida para esta procedencia.', '3');
          return;
        }
      }

      const [initialHoursBlock, initialMinutesBlock] = this.fv3.startTime?.split(':').map(Number);
      const [finalHoursBlock, finalMinutesBlock] = this.fv3.endTime?.split(':').map(Number);

      const initialTotalMinutesBlock = initialHoursBlock * 60 + initialMinutesBlock;
      const finalTotalMinutesBlock = finalHoursBlock * 60 + finalMinutesBlock;

      if (initialTotalMinutesBlock >= finalTotalMinutesBlock) {
        this.modalSvc.openStatusMessage('Aceptar', 'La hora inicial debe ser menor a la hora final ', '3');
        return;
      }

      //Validacion para saber si las horas bloqueadas enstan en el rango del horario establecido

      if (this.fv1.startTime && this.fv1.endTime) {
        const [horaInicial, minutosInicial] = this.fv1.startTime?.split(':').map(Number); const [horaFinal, minutosFinal] = this.fv1.endTime?.split(':').map(Number);

        const horarioMinutosInicial = horaInicial * 60 + minutosInicial;
        const horarioMinutosFinal = horaFinal * 60 + minutosFinal;

        if (
          horarioMinutosInicial > initialTotalMinutesBlock ||
          horarioMinutosFinal < finalTotalMinutesBlock
        ) {
          this.modalSvc.openStatusMessage('Aceptar', 'El horario de bloqueo debe estar en los rangos de horarios de agenda seleccionados ', '3');
          return;
        }

        //Validar que no se este agregando encima de un bloqueo intermedio
        if (
          this.fc1.intermediate.value == true &&
          this.fv1.fromInter &&
          this.fv1.untilInter
        ) {
          //sacar los minutos de los intermedios

          const [horaIntermedioInicial, minutoIntermedioInicial] =
            this.fv1.fromInter?.split(':').map(Number);
          const [horaIntermedioFinal, minutoIntermedioFinal] =
            this.fv1.untilInter?.split(':').map(Number);

          const minutosInicialIntermedio =
            horaIntermedioInicial * 60 + minutoIntermedioInicial;
          const minutosFinalIntermedio =
            horaIntermedioFinal * 60 + minutoIntermedioFinal;

          if (
            initialTotalMinutesBlock == minutosInicialIntermedio ||
            finalTotalMinutesBlock == minutosFinalIntermedio
          ) {
            this.modalSvc.openStatusMessage('Aceptar', 'El horario de bloqueo VIP debe estar fuera de los en los rangos de horarios de intermedio ', '3');
            return;
          } else if (
            initialTotalMinutesBlock > minutosInicialIntermedio &&
            initialTotalMinutesBlock < minutosFinalIntermedio
          ) {
            this.modalSvc.openStatusMessage('Aceptar', 'El horario de bloqueo VIP debe estar fuera de los en los rangos de horarios de intermedio ', '3');
            return;
          } else if (
            finalTotalMinutesBlock > minutosInicialIntermedio &&
            finalTotalMinutesBlock < minutosFinalIntermedio
          ) {
            this.modalSvc.openStatusMessage('Aceptar', 'El horario de bloqueo VIP debe estar fuera de los en los rangos de horarios de intermedio ', '3');
            return;
          }
        }
      }

      //Validacion para evitar que se asignen horrio vip encima de citas ya asignadas

      let datesNoAvailable = [];
      this.fv3.startDate &&
        this.fv3.endDate
      if (this.busyDates.length) {
        datesNoAvailable = this.busyDates.filter(e =>
          e.fecha && this.fv3.startDate &&
          this.fv3.endDate && new Date(e.fecha) >= new Date(this.fv3.startDate) && new Date(e.fecha) <= new Date(this.fv3.endDate)
        );
      }

      if (datesNoAvailable.length) {
        for (const cita of datesNoAvailable) {
          const [horaInicialCita, minutoInicialCita] = cita.horaInicial.split(':').map(Number);
          const [horaFinalCita, minutoFinalCita] = cita.horaFinal.split(':').map(Number);

          const minutosTotalesInicialCita = horaInicialCita * 60 + minutoInicialCita;
          const minutosTotalesFinalCita = horaFinalCita * 60 + minutoFinalCita;

          if (
            (initialTotalMinutesBlock >= minutosTotalesInicialCita && initialTotalMinutesBlock < minutosTotalesFinalCita) ||
            (finalTotalMinutesBlock > minutosTotalesInicialCita && initialTotalMinutesBlock <= minutosTotalesFinalCita) ||
            (initialTotalMinutesBlock <= minutosTotalesInicialCita && finalTotalMinutesBlock >= minutosTotalesFinalCita)
          ) {
            this.modalSvc.openStatusMessage('Aceptar', 'No se puede agregar horario de bloqueo vip, coincide con una reserva o cita existente.', '3');
            return;
          }

        }
      }

      try {
        this.generarArregloVIP(this.fv3.startDate, this.fv3.endDate, this.fv3.startTime + ':00', this.fv3.endTime + ':00', this.fv3.procedencia);
        this.arregloVisibleVIP();
        this.modalSvc.openStatusMessage('Aceptar', 'Bloqueo VIP agregado', '1');
      } catch (error) {
        this.modalSvc.openStatusMessage('Aceptar', 'Error al agregar bloqueo VIP', '4');
      }
    } else {
      this.modalSvc.openStatusMessage('Aceptar', 'Debe llenar todos los campos para los bloqueos VIP ', '3');
    }
  }

  generarArregloVIP(startDate: any, endDate: any, startTime: any, endTime: any, idOriginEntity: any) {
    let obj: any = {
      id: this.idIncrementable,
      idOriginEntity: idOriginEntity,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      startTime: startTime,
      endTime: endTime,
    };
    this.fechasVIPTodas.push(obj);
    this.fc3.startDate.reset();
    this.fc3.endDate.reset();
    this.fc3.startTime.setValue('00:00');
    this.fc3.endTime.setValue('00:00');
    this.idIncrementable++;
  }

  arregloVisibleVIP() {
    if (this.fv3.procedencia) {
      let procedencia = this.fv3.procedencia;
      let i = 0;
      this.fechasVIPSoloVisual = [];

      let arreglo = this.fechasVIPTodas.filter((item) => {
        item.id = i;
        i++;
        return item.idOriginEntity === procedencia;
      });

      this.fechasVIPSoloVisual = arreglo;
      this.fechaMinimaVip = new Date();

    } else {
      this.fechasVIPSoloVisual = [];
    }
  }

  filterVipInputs() {
    this.fc3.procedencia.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.fc3.startDate.setValue('');
      this.fc3.endDate.setValue('');
      this.fc3.startTime.setValue('00:00');
      this.fc3.endTime.setValue('00:00');
      this.arregloVisibleVIP();
    });
    this.fc3.startDate.valueChanges.subscribe((e: any) => {
      if (e) {
        this.fechaMinimaVip = new Date(e);
        this.fc3.endDate.setValue('');
      }
    });
  }

  eliminarHorarioVip(id: any) {
    this.fechasVIPTodas = this.fechasVIPTodas.filter((e: any) => e.id != id);
    this.fechasVIPSoloVisual = this.fechasVIPSoloVisual.filter(
      (e: any) => e.id != id
    );
  }

  editarHorarioVip(id: any) {
    let item = this.fechasVIPSoloVisual.find((e: any) => e.id == id);
    if (item) {
      setTimeout(() => {
        let start: any = moment(item.startDate, 'DD/MM/YYYY').toDate();
        let end: any = moment(item.endDate, 'DD/MM/YYYY').toDate();
        this.fc3.startTime.setValue(item.startTime.slice(0, -3));
        this.fc3.endTime.setValue(item.endTime.slice(0, -3));
        this.fc3.startDate.setValue(start);
        this.fc3.endDate.setValue(end);
        this.fechasVIPTodas = this.fechasVIPTodas.filter(
          (e: any) => e.id != id
        );
        this.fechasVIPSoloVisual = this.fechasVIPSoloVisual.filter(
          (e: any) => e.id != id
        );
      }, 500);
    }
  }

  validarObligatoriedadElemento(idCategory: string) {
    let categoria = this.categorias.find((e) => e.idCategory == idCategory);
    if (categoria && categoria.requireElements) {
      this.fc.idElement.addValidators(Validators.required);
      this.showElements = true;
      this.flagContentExams = false;
    } else if (categoria && categoria.associatedExam) {
      this.fc.idElement.addValidators(Validators.required);
      this.showElements = true;
      this.flagContentExams = true;
    } else {
      this.fc.idElement.clearValidators();
      this.showElements = false;
      this.flagContentExams = false;
    }
    this.fc.idElement.updateValueAndValidity();
  }


  //Funcionalidad de horarios especiales//

  addSpecialHour() {
    if (this.fv4.specialHour && this.fv4.endTime && this.fv4.startTime) {
      const [initialHours, initialMinutes] = this.fv4.startTime?.split(':').map(Number);
      const [finalHours, finalMinutes] = this.fv4.endTime?.split(':').map(Number);

      const initialTotalMinutesSpecialDay = initialHours * 60 + initialMinutes;
      const finalTotalMinutesSpecialDay = finalHours * 60 + finalMinutes;

      if (initialTotalMinutesSpecialDay >= finalTotalMinutesSpecialDay) {
        this.modalSvc.openStatusMessage('Aceptar', 'La hora inicial debe ser menor a la hora final ', '3');
        return;
      }

      let datesNoAvailable = [];

      if (this.busyDates.length) {
        datesNoAvailable = this.busyDates.filter(e =>
          e.dia == 1 || e.dia == 2 || e.festivo == true
        );
      }
      if (datesNoAvailable.length) {
        for (const cita of datesNoAvailable) {
          //Validar que si el dia que se esta editando ya hay alguna cita que el horario no lo deje por fuera:
          const [horaInicialCita, minutoInicialCita] = cita.horaInicial.split(':').map(Number);
          const [horaFinalCita, minutoFinalCita] = cita.horaFinal.split(':').map(Number);

          const minutosTotalesInicialCita = horaInicialCita * 60 + minutoInicialCita;
          const minutosTotalesFinalCita = horaFinalCita * 60 + minutoFinalCita;

          let diasSeleccionados = this.fv4.specialHour.map(e => String(e))

          if (cita.festivo && diasSeleccionados.includes('3') || diasSeleccionados.includes(cita.dia)) {
            if ((minutosTotalesInicialCita >= initialTotalMinutesSpecialDay && minutosTotalesFinalCita > finalTotalMinutesSpecialDay) ||
              // Cita empieza antes del horario permitido y termina dentro
              (minutosTotalesInicialCita < initialTotalMinutesSpecialDay && minutosTotalesFinalCita <= finalTotalMinutesSpecialDay) ||
              // Cita envuelve completamente el horario permitido
              (minutosTotalesInicialCita < initialTotalMinutesSpecialDay && minutosTotalesFinalCita > finalTotalMinutesSpecialDay)
            ) {
              this.modalSvc.openStatusMessage('Aceptar', 'No se puede editar horario especial, existen citas vigentes que quedan fuera de los horarios seleccionados.', '4');
              return
            }
          }
        }
      }



      if (this.fv4.hasIntermedial == true) {
        //Validaciones para los horarios intermedios
        if (this.fv4.fromInter && this.fv4.endInter) {
          const [horaIntermedioInicial, minutoIntermedioInicial] = this.fv4.fromInter
            ?.split(':')
            .map(Number);
          const [horaIntermedioFinal, minutoIntermedioFinal] = this.fv4.endInter
            ?.split(':')
            .map(Number);

          const totalMinutosIntermedioInicial = horaIntermedioInicial * 60 + minutoIntermedioInicial;
          const totalMinutosIntermedioFinal = horaIntermedioFinal * 60 + minutoIntermedioFinal;

          if (totalMinutosIntermedioInicial >= totalMinutosIntermedioFinal) {
            this.modalSvc.openStatusMessage('Aceptar', 'La hora inicial del intermedio debe ser menor que el final', '3');
            return;
          }
          if (totalMinutosIntermedioInicial < initialTotalMinutesSpecialDay || totalMinutosIntermedioFinal > finalTotalMinutesSpecialDay) {
            this.modalSvc.openStatusMessage('Aceptar', 'El intermedio debe estar dentro de los rangos de tiempo seleccionados', '3');
            return;
          }


          let datesNoAvailable = [];

          if (this.busyDates.length) {
            datesNoAvailable = this.busyDates.filter(e =>
              e.dia == 1 || e.dia == 2 || e.festivo == true
            );
          }
          if (datesNoAvailable.length) {
            for (const cita of datesNoAvailable) {
              //Validar que si el dia que se esta editando ya hay alguna cita que el horario no lo deje por fuera:
              const [horaInicialCita, minutoInicialCita] = cita.horaInicial.split(':').map(Number);
              const [horaFinalCita, minutoFinalCita] = cita.horaFinal.split(':').map(Number);

              const minutosTotalesInicialCita = horaInicialCita * 60 + minutoInicialCita;
              const minutosTotalesFinalCita = horaFinalCita * 60 + minutoFinalCita;

              let diasSeleccionados = this.fv4.specialHour.map(e => String(e))

              if (cita.festivo && diasSeleccionados.includes('3') || diasSeleccionados.includes(cita.dia)) {
                if (minutosTotalesInicialCita >= totalMinutosIntermedioInicial && minutosTotalesInicialCita <= totalMinutosIntermedioFinal
                  || minutosTotalesFinalCita >= totalMinutosIntermedioInicial && minutosTotalesFinalCita < totalMinutosIntermedioFinal
                ) {
                  this.modalSvc.openStatusMessage('Aceptar', 'No se puede editar horario especial, el horario de intermedio coincide con citas vigentes en el(los) horarios seleccionados', '4');
                  return
                }
              }
            }
          }

        } else {
          this.modalSvc.openStatusMessage('Aceptar', 'Seleccione un rago de horario para el intermedio', '3');
          return;
        }

      }

      for (const i of this.fv4.specialHour) {
        this.horariosEspeciales.push({
          idspecialHour: i,
          specialHour: this.specialsHoursList.find(e => e.idSpecialDay == i).specialDay,
          startTime: this.fv4.startTime,
          endTime: this.fv4.endTime,
          hasIntermedial: this.fv4.hasIntermedial,
          fromInter: this.fv4.hasIntermedial ? this.fv4.fromInter : '',
          endInter: this.fv4.hasIntermedial ? this.fv4.endInter : '',
        })

        this.specialsHoursList = this.specialsHoursList.filter(e => e.idSpecialDay != i);
        for (const e of this.specialsHoursList) {
          e.checked = false;
        }
        this.specialHourElementEdit = undefined
      }

      this.modalSvc.openStatusMessage('Aceptar', 'Horario especial agregado', '1');
      this.fc4.specialHour.reset();
      this.fc4.endTime.setValue('00:00');
      this.fc4.startTime.setValue('00:00');
      this.fc4.hasIntermedial.setValue(false);
      this.fc4.fromInter.setValue('00:00');
      this.fc4.endInter.setValue('00:00');


    } else {
      this.modalSvc.openStatusMessage('Aceptar', 'Debe llenar todos los campos para ingresar un horario especial ', '3');
    }
  }

  deleteSpecialHours(id: number) {
    if (this.specialHourElementEdit) {
      this.modalSvc.openStatusMessage('Aceptar', 'Actualmente esta editando un horario', '3');
      return
    }

    //Validamos si hay citas en estos horarios especiales
    let datesNoAvailable = [];

    if (this.busyDates.length) {
      datesNoAvailable = this.busyDates.filter(e =>
        e.dia == 1 || e.dia == 2 || e.festivo == true
      );
    }
    if (datesNoAvailable.length) {
      for (const cita of datesNoAvailable) {
        if (cita.festivo && id == 3) return this.modalSvc.openStatusMessage('Aceptar', 'No se puede eliminar horario especial, existen citas vigentes en días especiales', '4');
        if (cita.dia == id) return this.modalSvc.openStatusMessage('Aceptar', 'No se puede eliminar horario especial, existen citas vigentes en días especiales', '4');
      }
    }

    let horario = this.specialsHoursListCopy.find(e => e.idSpecialDay == id);
    let newHour = { ...horario }
    newHour.checked = false;
    this.specialsHoursList.push(newHour);
    this.horariosEspeciales = this.horariosEspeciales.filter(e => e.idspecialHour != id);
    this.modalSvc.openStatusMessage('Aceptar', 'Horario especial eliminado correctamente', '1');

  }

  editSpecialHours(id: number) {
    this.specialsHoursList = this.specialsHoursList.map(x => { x.checked = false; return x });
    let elemento = this.horariosEspeciales.find(e => e.idspecialHour == id);
    let horario = this.specialsHoursListCopy.find(e => e.idSpecialDay == id);
    if (this.specialHourElementEdit) {
      this.modalSvc.openStatusMessage('Aceptar', 'Actualmente esta editando un horario', '3');
      return
    }

    if (elemento && horario) {

      let newHour = { ...horario }
      newHour.checked = true;
      this.specialsHoursList.push(newHour);
      this.fc4.specialHour.setValue([elemento.idspecialHour]);
      this.fc4.endTime.setValue(elemento.endTime);
      this.fc4.startTime.setValue(elemento.startTime);
      this.fc4.hasIntermedial.setValue(elemento.hasIntermedial);


      this.specialHourElementEdit = this.fv4;
      setTimeout(() => {
        if (elemento.hasIntermedial) {
          this.fc4.fromInter.setValue(elemento.fromInter);
          this.fc4.endInter.setValue(elemento.endInter);
        }
      }, 100);
    }

    this.horariosEspeciales = this.horariosEspeciales.filter(e => e.idspecialHour != id);


  }
  // FIN Funcionalidad de horarios especiales//

  //Funcion para trazabilidad///

  trazabilidad(antes: any, despues: any | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 1,
      idMovimiento,
      modulo: "Agenda general",
      movimiento,
      subModulo: "Configuración de agenda"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }


  trazabilidadGuardarEditar(objetoEnviado: any) {
    //Trazabilidad
    let antes;
    let despues;
    if (this.isEdit) {
      const nuevoObj = {
        ...objetoEnviado,
        fullNameUserAction: this.nombreUsuario,
      };
      antes = this.transformObject(this.currentConfigurationTotal)
      despues = JSON.parse(JSON.stringify(nuevoObj));
      despues.idUserAction = this.idUser;

      //Verificar los horarios de bloqueo y vip, si son nuevos se debe poner un id en 0 pero evitar error
      if (despues.blockingSchedules && despues.blockingSchedules.length) {
        for (const b of despues.blockingSchedules) {
          if (!b.idBlockingSchedule) {
            b.idBlockingSchedule = 0;
          }
        }
      }

      if (despues.vipBlockings && despues.vipBlockings.length) {
        for (const vip of despues.vipBlockings) {
          if (!vip.idVipBlock) {
            vip.idVipBlock = 0;
          }
        }
      }

    } else {
      const nuevoObj = {
        ...objetoEnviado,
        fullNameUserAction: this.nombreUsuario,
      };
      antes = JSON.parse(JSON.stringify(nuevoObj));
    }

    let elements: any = null;

    if (objetoEnviado?.elements?.length) {
      elements = [];
      for (const x of objetoEnviado.elements) {
        let elementoInArray = this.elementos.find(e => e.idElement == x);
        if (elementoInArray) {
          let obj = {
            elementName: elementoInArray.elementName
          }
          elements.push(obj)
        }

      }
    }

    if (despues) {
      despues.elements = elements
    } else {
      antes.elements = elements
    }


    this.isEdit ? this.trazabilidad(antes, despues, 2, 'Edición') : this.trazabilidad(antes, null, 1, 'Creación');

    //Fin trazabilidad

  }

  transformObject(originalObj: any) {
    const {
      idAgenda,
      generalDetails,
      configurationsDetails
    } = originalObj;

    let transformedObj: any = {
      idAttentionCenter: generalDetails.idAttentionCenter,
      idCategory: generalDetails.idCategory,
      idSpecialties: generalDetails.idSpecialties,
      idCharacteristic: generalDetails.idCharacteristic,
      idTypeAttention: generalDetails.idTypeAttention,
      customerService: {
        startDate: configurationsDetails.startDate,
        endDate: configurationsDetails.endDate,
        startTime: configurationsDetails.startTime,
        endTime: configurationsDetails.endTime,
        intermediate: configurationsDetails.intermediate,
        daysAttention: configurationsDetails.daysAttention,
        fromInter: configurationsDetails.fromInter,
        untilInter: configurationsDetails.untilInter
      },
      //Se agregrara si hay horarios de bloqueo si no no
      ...(configurationsDetails.blockingTimes?.length > 0 && {
        blockingSchedules: configurationsDetails.blockingTimes.map((blockingTime: any) => ({
          blockDate: blockingTime.blockDate + ".000Z",
          startTime: blockingTime.startTime,
          endTime: blockingTime.endTime,
          blockingDays: blockingTime.blockingDays,
          hourlyBlocking: blockingTime.hourlyBlocking,
          idBlockingSchedule: blockingTime.idBlockingSchedule | 0
        }))
      }),

      //Se agregrara si hay horarios vip si no no
      ...(configurationsDetails.blockingVip?.length > 0 && {
        vipBlockings: configurationsDetails.blockingVip.map((blockingVIP: any) => ({
          startDate: blockingVIP.startDate,
          endDate: blockingVIP.endDate,
          startTime: blockingVIP.startTime,
          endTime: blockingVIP.endTime,
          idOriginEntity: blockingVIP.idOriginEntity,
          idVipBlock: blockingVIP.idVipBlock | 0
        }))
      }),
      idAgenda: idAgenda,
      fullNameUserAction: generalDetails.fullNameUserAction,
      idUserAction: generalDetails.idUserAction
    };

    let elements: any = null;

    if (generalDetails.elements.length) {
      elements = [];
      for (const x of generalDetails.elements) {
        let obj = {
          elementName: x.elementName
        }
        elements.push(obj)
      }
    }
    transformedObj.elements = elements
    return transformedObj;
  }



}
