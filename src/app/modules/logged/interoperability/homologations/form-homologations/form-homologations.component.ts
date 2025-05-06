import { NgClass, NgIf } from '@angular/common';
import { Component, ElementRef, HostListener, Renderer2, TemplateRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { DictionaryDataService } from '@app/services/interoperability/dictionary-data/dictionary-data.service';
import { HomologationsService } from '@app/services/interoperability/homologations/homologations.service';
import { IntegrationsService } from '@app/services/interoperability/integrations/integrations.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '@app/shared/inputs/toggle/toggle.component';
import { Homologation, HomologationsByNamePage } from '@app/shared/interfaces/interoperability/homologations.model';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { forkJoin, lastValueFrom, Subject, takeUntil } from 'rxjs';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-form-homologations',
  standalone: true,
  imports: [BasicInputComponent, MatIconModule, NgxPaginationModule, MatTooltipModule, NgClass, NgIf],
  templateUrl: './form-homologations.component.html',
  styleUrl: './form-homologations.component.scss'
})
export class FormHomologationsComponent {

  idHomologation: number | undefined = undefined;

  formHomologation = this.fb.group({
    idIntegrations: ['', [Validators.required]],
    idDataDictionary: ['', [Validators.required]],
    externalCode: ['', [Validators.required]],
    ownCode: ['', [Validators.required]],
    descriptions: ['', [Validators.required]],
  });

  permisosDelModulo: any


  listOfIntegrations: any[] = [];
  listOfDictionarys: any[] = [];
  listOfOwnCode: any[] = [];

  cabeceros: string[] = ['Integración', 'Diccionario de datos', 'Código propio', 'Código externo', 'Descripción', 'Editar', 'Eliminar'];
  data: any[] = []
  pageSize: number = 5;
  pageNumber: number = 0;
  currentPage: number = 1;
  counter: number = 0;
  paginadorNumber: number = 1;

  currentHomologation: any;
  currentEditHomologationId = 0;
  integration: number = 0;
  dictionary: number = 0;

  currentStatus: 'c' | 'e' = 'c'
  currentIdTemporal: number = 0;
  isListOwnCode: boolean = false;

  currentOwnCode: string = ''
  currentexternalCode: string = ''
  homologationsDataToAdd: any[] = [];
  objetosOriginalesEditados: any[] = []

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  constructor(
    private actRoute: ActivatedRoute,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private shadedSVC: SharedService,
    private loaderSvc: LoaderService,
    private modalService: ModalService,
    private fb: FormBuilder,
    private tzs: TrazabilidadService,
    private dialog: MatDialog,
    private homologationsSvc: HomologationsService,
    private integrationsSvc: IntegrationsService,
    private dictionarySvc: DictionaryDataService
  ) {
    this.actRoute.params.subscribe(params => {
      this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Homologación')
      let idHomologation = params['idHomologation'];
      if (idHomologation) {
        this.idHomologation = Number(idHomologation);
        if (!this.permisosDelModulo.Editar) {
          this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
          this.cancel()
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.observeDictionaries();
    this.observeOwnCodesChanges();
    await this.getDictionaries();
    await this.getIntegrations();
    await this.getInfoHomologation();
    this.ajustarAlto()
  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    this.currentPage = 1;
    setTimeout(() => {
      this.ajustarAlto()
      //setTimeout(async () => {
      //    await this.getHomologationList(this.currentPage);
      //}, 100);
    }, 100)
  }

  get fv() {
    return this.formHomologation.value
  }
  get fc() {
    return this.formHomologation.controls
  }

  ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const titulo = this.elRef.nativeElement.querySelector('.titulo').offsetHeight;
    const formulario = this.elRef.nativeElement.querySelector('.cont-form').offsetHeight;
    let heightTF = container - titulo - 98;
    let he = heightTF - formulario - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.form-and-table'), 'height', `${heightTF}px`);
    let paginador = he / 25;
    let paginas = Math.floor(paginador / 2);
    this.pageSize = paginas > 4 ? paginas : 4

  }

  observeDictionaries() {
    this.fc.idDataDictionary.valueChanges.subscribe((value) => {
      if (value) {
        this.formHomologation.get('ownCode')?.setValue('')  //Limpiamos el campo de código propio
        this.formHomologation.get('externalCode')?.setValue('')  //Limpiamos el campo de código externo
        let dictionary = this.listOfDictionarys.find(e => e.idDataDictionary == value);
        if (dictionary && dictionary.haveTable) {
          this.isListOwnCode = true;
          this.getOwnCodes(Number(value));
        } else {
          this.isListOwnCode = false;
          this.listOfOwnCode = []
        }

      } else {
        this.isListOwnCode = false;
        this.listOfOwnCode = []
      }
    })
  }

  observeOwnCodesChanges(){
    this.fc.ownCode.valueChanges.subscribe((value) => {
      if (value && this.isListOwnCode) {
        let ownCode = this.listOfOwnCode.find(e => e.id == value);
        if (ownCode) {
         this.fc.descriptions.setValue(ownCode.description)
        }
      }
    })
  }

  async getOwnCodes(idDataDictionary: number) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando códigos propios' });

      let r: any = await lastValueFrom(this.dictionarySvc.getCodesOwnById(idDataDictionary));
      this.loaderSvc.hide();
      if (r.ok && r.data) {
        this.listOfOwnCode = r.data

        if (this.currentOwnCode) {
          this.formHomologation.get('ownCode')?.setValue(this.currentOwnCode);
          this.formHomologation.get('externalCode')?.setValue(this.currentexternalCode);
          this.currentOwnCode = '';
          this.currentexternalCode = '';
        }

      } else {
        this.listOfOwnCode = []
      }


    } catch (error) {
      this.loaderSvc.hide();
      console.error(error);

    }

  }

  async getIntegrations() {

    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando integraciones' });
      let i: any = await lastValueFrom(this.integrationsSvc.getIntegrationsActive());
      this.loaderSvc.hide();
      if (i.ok && i.data) {
        this.listOfIntegrations = i.data
      } else {
        this.listOfIntegrations = []
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer las integraciones', '4')
      console.error(error)
      this.loaderSvc.hide()
    }
  }


  async getDictionaries() {

    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando diccionario de datos' });

      let i: any = await lastValueFrom(this.dictionarySvc.getDictionaryActives());
      this.loaderSvc.hide();
      if (i.ok && i.data) {
        this.listOfDictionarys = i.data
      } else {
        this.listOfDictionarys = []
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer los diccionarios de datos', '4')
      console.error(error)
      this.loaderSvc.hide()
    }
  }

  async getInfoHomologation() {
    if (this.idHomologation) {
      let objectPaginator: HomologationsByNamePage = {
        nameCodeSearch: '',
        idIntegration: 0,
        idDataDictionary: 0,
        idHomologation: this.idHomologation,
        pageSize: 1,
        pageNumber: 1
      }

      try {
        this.loaderSvc.show();
        this.loaderSvc.text.set({ text: 'Cargando homologación' });
        let i: any = await lastValueFrom(this.homologationsSvc.getHomologations(objectPaginator));
        this.loaderSvc.hide();
        if (i.ok && i.data) {
          this.currentHomologation = i.data.Homologaciones[0];
          let d = i.data.Homologaciones[0];
          this.formHomologation.get('idIntegrations')?.setValue(d.idIntegrations);
          this.formHomologation.get('idDataDictionary')?.setValue(d.idDataDictionary);
          this.formHomologation.get('externalCode')?.setValue(d.externalCode);
          this.formHomologation.get('descriptions')?.setValue(d.descriptions);
          this.currentOwnCode = d.ownCode
          this.currentexternalCode = d.externalCode
          // this.formHomologation.get('ownCode')?.setValue(d.ownCode);
          this.integration = d.idIntegrations
          this.dictionary = d.idDataDictionary
          this.currentEditHomologationId = d.idHomologation
          this.currentStatus = 'e'
          this.getHomologationTableRelations();

        } else {
          this.modalService.openStatusMessage('Aceptar', 'No se encontro información de la homologación', '4')
          this.currentHomologation = undefined
        }
      } catch (error) {
        this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer la información de la homologación', '4')
        console.error(error)
        this.loaderSvc.hide()
      }
    }

  }

  async getHomologationTableRelations(pageNumber?: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando homologaciones' })
      let nameCodeSearch = '';

      let objectPaginator: HomologationsByNamePage = {
        nameCodeSearch,
        idIntegration: this.integration,
        idDataDictionary: this.dictionary,
        idHomologation: 0,
        pageSize: this.pageSize,
        pageNumber: pageNumber || 1
      }
      if (!pageNumber) this.currentPage = 1;
      let i = await lastValueFrom(this.homologationsSvc.getHomologations(objectPaginator));
      this.loaderSvc.hide()
      if (i.ok && i.data) {
        this.counter = i.data.RegistrosTotales;
        this.data = i.data.Homologaciones.slice(0, this.pageSize).map((e: any) => {
          if (this.homologationsDataToAdd.length) {
            let exist = this.homologationsDataToAdd.find(s => s.idHomologation == e.idHomologation)
            if (exist) {
              return exist
            }
          }
          return e
        });
      } else {
        this.modalService.openStatusMessage('Aceptar', 'No se encontraron homologaciones relacionadas', '3')
        this.data = []
        this.currentPage = 1;
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer las homologaciones', '4')
      this.loaderSvc.hide()
    }
  }

  cancel() {
    this.router.navigate(['/inicio/interoperabilidad/homologaciones'])
  }

  async addHomologationToTable() {
    if (this.formHomologation.invalid) {
      this.formHomologation.markAllAsTouched()
      return;
    }

    let objeto: any = {
      idHomologation: this.idHomologation ? this.currentEditHomologationId : 0,
      idIntegrations: this.fv.idIntegrations,
      idDataDictionary: this.fv.idDataDictionary,
      externalCode: this.fv.externalCode,
      ownCode: String(this.fv.ownCode),
      descriptions: this.fv.descriptions,
      integrationsName: this.listOfIntegrations.find(e => e.idIntegrations == this.fv.idIntegrations).integrationsName,
      dictionaryName: this.listOfDictionarys.find(e => e.idDataDictionary == this.fv.idDataDictionary).dictionaryName,
      active: true,
      markAsDeleted: false
    };


    if (this.idHomologation) {
      //En caso de que editar
      let indexData = this.data.findIndex(e => e.idHomologation === this.currentEditHomologationId);
      if (indexData !== -1) {
        this.data[indexData] = { ...this.data[indexData], ...objeto };
      }

      let indexToAdd = this.homologationsDataToAdd.findIndex(e => e.idHomologation === this.currentEditHomologationId);
      if (indexToAdd !== -1) {
        this.homologationsDataToAdd[indexToAdd] = { ...this.homologationsDataToAdd[indexToAdd], ...objeto };
      } else {
        this.homologationsDataToAdd.push(objeto)
      }
      this.data = [...this.data];
      this.homologationsDataToAdd = [...this.homologationsDataToAdd];
      //Guardamos el objeto original para tener pendiente en un arreglo para la trazabilidad
      let indexDataOrginal = this.objetosOriginalesEditados.findIndex(e => e.idHomologation === this.currentEditHomologationId);
      if (indexDataOrginal == -1 && this.currentEditHomologationId) {
        let objectPaginator: HomologationsByNamePage = {
          nameCodeSearch: '',
          idIntegration: 0,
          idDataDictionary: 0,
          idHomologation: this.currentEditHomologationId,
          pageSize: this.pageSize,
          pageNumber: 1
        }
        this.loaderSvc.show();
        let i = await lastValueFrom(this.homologationsSvc.getHomologations(objectPaginator));
        this.loaderSvc.hide()
        if (i.ok && i.data) {
          this.objetosOriginalesEditados.push(i.data.Homologaciones[0])
        }
      }



      this.currentStatus = 'c'
      this.formHomologation.reset();
      this.currentEditHomologationId = 0;



    } else {

      //En caso de que sea agregar
      if (this.currentStatus === 'c') {
        objeto.idTemporal = this.currentIdTemporal + 1
        this.data.unshift(objeto);
        this.homologationsDataToAdd.unshift(objeto);
        this.currentIdTemporal++;
      } else {
        let indexData = this.data.findIndex(e => e.idTemporal === this.currentEditHomologationId);
        if (indexData !== -1) {
          this.data[indexData] = { ...this.data[indexData], ...objeto };
        }

        let indexToAdd = this.homologationsDataToAdd.findIndex(e => e.idTemporal === this.currentEditHomologationId);
        if (indexToAdd !== -1) {
          this.homologationsDataToAdd[indexToAdd] = { ...this.homologationsDataToAdd[indexToAdd], ...objeto };
        }

        // Forzar actualización si Angular no detecta el cambio automáticamente
        this.data = [...this.data];
        this.homologationsDataToAdd = [...this.homologationsDataToAdd];

      }
      this.currentStatus = 'c'
      this.formHomologation.reset();
      this.currentEditHomologationId = 0;
    }

  }

  changeStatus(event: any, idHomologation: any, idTemporal: any) {

    let objetoEnData = idHomologation
      ? this.data.find(e => e.idHomologation === idHomologation)
      : this.homologationsDataToAdd.find(e => e.idTemporal === idTemporal);



    let objeto: any = {
      idHomologation: idHomologation ? this.idHomologation : 0,
      idIntegrations: objetoEnData.idIntegrations,
      idDataDictionary: objetoEnData.idDataDictionary,
      externalCode: objetoEnData.externalCode,
      ownCode: objetoEnData.ownCode,
      descriptions: objetoEnData.descriptions,
      integrationsName: this.listOfIntegrations.find(e => e.idIntegrations == objetoEnData.idIntegrations).integrationsName,
      dictionaryName: this.listOfDictionarys.find(e => e.idDataDictionary == objetoEnData.idDataDictionary).dictionaryName,
      active: event,
      markAsDeleted: false
    };

    let indexData = idHomologation
      ? this.data.findIndex(e => e.idHomologation === idHomologation)
      : this.data.findIndex(e => e.idTemporal === idTemporal);
    if (indexData !== -1) {
      this.data[indexData] = { ...this.data[indexData], ...objeto };
    }

    let indexToAdd = idHomologation
      ? this.homologationsDataToAdd.findIndex(e => e.idHomologation === idHomologation)
      : this.homologationsDataToAdd.findIndex(e => e.idTemporal === idTemporal);

    if (indexToAdd !== -1) {
      this.homologationsDataToAdd[indexToAdd] = { ...this.homologationsDataToAdd[indexToAdd], ...objeto };
    } else {
      this.homologationsDataToAdd.push(objeto)
    }

    // Forzar actualización si Angular no detecta el cambio automáticamente
    this.data = [...this.data];
  }

  editHomologation(idHomologation: any, idTemporal: any) {
    let objetoEnData = idHomologation
      ? this.data.find(e => e.idHomologation === idHomologation)
      : this.homologationsDataToAdd.find(e => e.idTemporal === idTemporal);

    if (objetoEnData) {
      this.formHomologation.patchValue({
        idIntegrations: objetoEnData.idIntegrations,
        idDataDictionary: objetoEnData.idDataDictionary,
        externalCode: objetoEnData.externalCode,
        ownCode: objetoEnData.ownCode,
        descriptions: objetoEnData.descriptions
      });
    }
    this.currentStatus = 'e';
    this.currentEditHomologationId = idHomologation ? idHomologation : idTemporal
  }

  openModalConfirm(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {

    if (this.homologationsDataToAdd.length === 0) {
      this.modalService.openStatusMessage('Aceptar', `Debe ${this.idHomologation ? 'editar' : 'crear'} por lo menos una homologación`, '3');
      return
    }
    titulo = `¿Está seguro de ${this.idHomologation ? 'editar' : 'crear'} ${this.homologationsDataToAdd.length} homologaci${this.homologationsDataToAdd.length === 1 ? 'ón' : 'ones'}?`;

    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: 'Cerrar',
      footer: true,
      title: titulo,
      type: '2',
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async x => {
      this.createOrUpdateHomologations();
      dialogRef.close();

    });
  }


  openModalConfirmClose(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {

    if (this.homologationsDataToAdd.length === 0) {
      this.cancel();
      return
    }
    titulo = `¿Está seguro de salir? Hay ${this.homologationsDataToAdd.length}  ${this.homologationsDataToAdd.length === 1 ? 'homologacion pendiente' : 'homologaciones pendientes'} por confirmar`;

    const destroy$: Subject<boolean> = new Subject<boolean>();

    const data: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: 'Cerrar',
      footer: true,
      title: titulo,
      type: '2',
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async x => {
      this.cancel();
      dialogRef.close();

    });
  }
  createOrUpdateHomologations() {
    if (this.homologationsDataToAdd.length > 0) {
      try {
        this.loaderSvc.show();
        this.loaderSvc.text.set({ text: 'Guardando homologaciones' });

        let requests = this.homologationsDataToAdd.map(obj =>
          this.homologationsSvc.createOrUpdateHomologation(obj)
        );

        forkJoin(requests).subscribe({
          next: (resultados) => {
            this.loaderSvc.hide();
            // Obtener los IDs de las homologaciones exitosas
            let successfulIds: any = [];
            if (this.idHomologation) {
              successfulIds = this.homologationsDataToAdd
                .map((obj, index) => resultados[index]?.ok === true ? obj.idHomologation : null)
                .filter(id => id !== null); // Filtrar valores nulos
            } else {
              successfulIds = this.homologationsDataToAdd
                .map((obj, index) => resultados[index]?.ok === true ? obj.idTemporal : null)
                .filter(id => id !== null); // Filtrar valores nulos
            }
            this.trazabilitySaveOrEdit(successfulIds)


            let successCount = successfulIds.length;
            let errorCount = resultados.filter(res => res?.ok === false).length;

            // Mostrar mensaje con el conteo
            if (successCount === this.homologationsDataToAdd.length) {
              this.modalService.openStatusMessage(
                'Aceptar',
                `Se ${this.idHomologation ? 'actualizaron' : 'crearon'}  ${successCount} homologación(es) correctamente.`,
                `1`
              );
            } else if (errorCount === this.homologationsDataToAdd.length) {
              this.modalService.openStatusMessage(
                'Aceptar',
                `Ninguna de las homologaciones se ${this.idHomologation ? 'actualizaron' : 'crearon'} verifique e intente de nuevo.`,
                `4`
              );
              return;
            } else {
              this.modalService.openStatusMessage(
                'Aceptar',
                `Se ${this.idHomologation ? 'actualizaron' : 'crearon'} ${successCount} homologación(es) correctamente. ${errorCount > 0 ? errorCount + ' fallaron.' : ''}`,
                `${errorCount > 0 ? '3' : '1'}`
              );
            }
            this.cancel();
          }
        });

      } catch (error) {
        this.loaderSvc.hide();
        console.error('Ocurrió un error en alguna petición:', error);
      }
    }
  }



  handlePageChange(page: any) {
    this.currentPage = page;
    if (this.idHomologation) {
      this.getHomologationTableRelations(page)
    }
  }

  trazabilitySaveOrEdit(successfulIds: any) {
    for (const i of successfulIds) {
      let antes;
      let despues;

      if (this.idHomologation) {


        let indexDataOrginal = this.objetosOriginalesEditados.findIndex(e => e.idHomologation == i);
        let indexDataEditada = this.homologationsDataToAdd.findIndex(e => e.idHomologation == i);
        if (indexDataOrginal !== -1 && indexDataEditada !== -1) {
          let objAnterior: Homologation = JSON.parse(JSON.stringify(this.objetosOriginalesEditados[indexDataOrginal]));
          let objetSending: Homologation = JSON.parse(JSON.stringify(this.homologationsDataToAdd[indexDataEditada]));
          const nuevoObj = {
            ...objetSending,
            fullNameUserAction: this.nombreUsuario,
            active: objAnterior.active
          };
          antes = {
            idHomologation: objAnterior.idDataDictionary,
            ownCode: objAnterior.ownCode,
            externalCode: objAnterior.externalCode,
            idIntegrations: objAnterior.idIntegrations,
            integrationsName: objAnterior.integrationsName,
            dictionaryName: objAnterior.dictionaryName,
            idDataDictionary: objAnterior.idDataDictionary,
            descriptions: objAnterior.descriptions,
            active: objAnterior.active,
            fullNameUserAction: objAnterior.fullNameUserAction,
            idUserAction: objAnterior.idUserAction,
          };
          despues = JSON.parse(JSON.stringify(nuevoObj));
          despues.idUserAction = this.idUser;
          this.trazabilidad(antes, despues, 2, 'Edición')
        }



      } else {

        let indexDataEditada = this.homologationsDataToAdd.findIndex(e => e.idTemporal == i);
        if (indexDataEditada !== -1) {
          let element: Homologation = JSON.parse(JSON.stringify(this.homologationsDataToAdd[indexDataEditada]))

          const nuevoObj = {
            ...element,
            fullNameUserAction: this.nombreUsuario,
          };
          antes = JSON.parse(JSON.stringify(nuevoObj));
          this.trazabilidad(antes, null, 1, 'Creación')

        }


      }
    }



    // this.idDataDictionary ? this.trazabilidad(antes, despues, 2, 'Edición') : this.trazabilidad(antes, null, 1, 'Creación');
  }


  trazabilidad(antes: Homologation, despues: Homologation | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 24,
      idMovimiento,
      modulo: "Homologación",
      movimiento,
      subModulo: "Homologaciones"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }
}
