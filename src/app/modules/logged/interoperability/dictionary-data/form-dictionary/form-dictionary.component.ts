import { Component, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, Router } from '@angular/router';
import { DictionaryDataService } from '@app/services/interoperability/dictionary-data/dictionary-data.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { CreateDictionary, Dictionary, DictionarysByNamePage } from '@app/shared/interfaces/interoperability/dictorionary-model';
import { lastValueFrom } from 'rxjs';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';

@Component({
  selector: 'app-form-dictionary',
  standalone: true,
  imports: [BasicInputComponent, MatCheckboxModule],
  templateUrl: './form-dictionary.component.html',
  styleUrl: './form-dictionary.component.scss'
})
export class FormDictionaryComponent {

  idDataDictionary: number | undefined = undefined;

  formDictionary = this.fb.group({
    dictionaryCode: ['', [Validators.required]],
    dictionaryName: ['', [Validators.required]],
    isTableRequired: [false, [Validators.required]],
    idListOfTables: [''],
    idTable: [''],
    descriptionTable: [''],

  });

  permisosDelModulo: any
  isTableRequired: boolean = false;

  listOfTables: any[] = [];
  listOfIds: any[] = [];
  listOfDescriptions: any[] = [];

  currentDictionary: Dictionary | undefined
  idSelected: string | null = null;
  descriptionSelected: string | null = null;

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
    private dictionarySvc: DictionaryDataService
  ) {
    this.actRoute.params.subscribe(params => {
      this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Diccionario de datos')
      let idDataDictionary = params['idDataDictionary'];
      if (idDataDictionary) {
        this.idDataDictionary = Number(idDataDictionary);
        if (!this.permisosDelModulo.Editar) {
          this.modalService.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4');
          this.cancel()
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.getTablesList();
    this.selectTableValueChanges();
    await this.getInfoIntegration();
  }

  async getInfoIntegration() {
    if (this.idDataDictionary) {
      let objectPaginator: DictionarysByNamePage = {
        nameCode: '',
        pageSize: 1,
        pageNumber: 1,
        idEntity: this.idDataDictionary
      }

      try {
        this.loaderSvc.show();
        this.loaderSvc.text.set({ text: 'Cargando integración' });
        let i: any = await lastValueFrom(this.dictionarySvc.getDictionarys(objectPaginator));
        this.loaderSvc.hide();
        if (i.ok && i.data) {
          this.currentDictionary = i.data.DiccionariosDeDatos[0];
          let d = i.data.DiccionariosDeDatos[0];
          this.formDictionary.get('dictionaryName')?.setValue(d.dictionaryName);
          this.formDictionary.get('dictionaryCode')?.setValue(d.dictionaryCode);
          if (d.haveTable) {
            this.isTable({ checked: d.haveTable });
            this.formDictionary.get('idListOfTables')?.setValue(d.idListOfTables);
            this.idSelected = d.tablesId
            this.descriptionSelected = d.descriptions
          }
        } else {
          this.modalService.openStatusMessage('Aceptar', 'No se encontro información del diccionario', '4')
          this.currentDictionary = undefined
        }
      } catch (error) {
        this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer la información del diccionario', '4')
        console.error(error)
        this.loaderSvc.hide()
      }
    }

  }
  async getTablesList() {

    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando tablas' });

      let i: any = await lastValueFrom(this.dictionarySvc.getTablesDb());
      this.loaderSvc.hide();
      if (i.ok && i.data) {
        this.listOfTables = i.data
      } else {
        this.listOfTables = []
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer la información del diccionario', '4')
      console.error(error)
      this.loaderSvc.hide()
    }
  }


  selectTableValueChanges() {
    this.formDictionary.get('idListOfTables')?.valueChanges.subscribe(t => {
      if (t) {
        let table = this.listOfTables.find(s => s.idListOfTables == t);
        if (table) {
          this.formDictionary.get('idTable')?.setValue('');
          this.formDictionary.get('descriptionTable')?.setValue('');
          this.getTablesByName(table.table)
        }
      }
    })
  }


  async getTablesByName(tableName: string) {
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Cargando tablas' });
      let t: any = await lastValueFrom(this.dictionarySvc.getTablesByName(tableName));
      this.loaderSvc.hide();
      if (t.ok && t.data) {
        this.listOfIds = [{ dato: t.data[0] }]
        this.listOfDescriptions = [{ dato: t.data[1] }]
        setTimeout(() => {
          if (this.idSelected) {
            this.formDictionary.get('idTable')?.setValue(this.idSelected);
            this.idSelected = null
          }
          if (this.descriptionSelected) {

            this.formDictionary.get('descriptionTable')?.setValue(this.descriptionSelected);
            this.descriptionSelected = null
          }
        }, 100);


      } else {
        this.listOfIds = []
        this.listOfDescriptions = []
      }
    } catch (error) {
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al traer la información del diccionario', '4')
      console.error(error)
      this.loaderSvc.hide()
    }

  }
  cancel() {
    this.router.navigate(['/inicio/interoperabilidad/diccionario'])
  }

  async saveOrUpdate() {

    if (this.formDictionary.invalid) {
      this.formDictionary.markAllAsTouched();
      return
    }

    let obj: CreateDictionary = {
      idDataDictionary: this.idDataDictionary || 0,
      dictionaryName: this.formDictionary.get('dictionaryName')?.value || '',
      dictionaryCode: this.formDictionary.get('dictionaryCode')?.value || '',

      table: this.isTableRequired,
      idListOfTables: Number(this.formDictionary.get('idListOfTables')?.value) || 0,
      tablesId: this.formDictionary.get('idTable')?.value || '',
      descriptions: this.formDictionary.get('descriptionTable')?.value || '',
      idUserAction: this.idUser,
      fullNameUserAction: this.nombreUsuario
    }
    try {
      this.loaderSvc.show();
      this.loaderSvc.text.set({ text: 'Guardando integración' })
      let r = await lastValueFrom(this.dictionarySvc.createUpdateDictionary(obj))
      if (r.ok) {
        this.trazabilitySaveOrEdit(obj);
        this.modalService.openStatusMessage('Aceptar', `Diccionario de datos ${this.idDataDictionary ? 'actualizado' : 'creado'} correctamente en el sistema`, '1');
        this.cancel();
      } else {
        this.modalService.openStatusMessage('Aceptar', r.message, '4');
      }
      this.loaderSvc.hide();
    } catch (error) {
      console.error(error);
      this.loaderSvc.hide();
      this.modalService.openStatusMessage('Aceptar', 'Ocurrio un error al guardar el diccionario de datos', '4');
    }


  }




  isTable(event: any) {

    if (event.checked) {
      this.isTableRequired = true;
      this.formDictionary.get('isTableRequired')?.setValue(true);
      this.formDictionary.get('idListOfTables')?.setValidators([Validators.required]);
      this.formDictionary.get('idTable')?.setValidators([Validators.required]);
      this.formDictionary.get('descriptionTable')?.setValidators([Validators.required]);
    } else {
      this.formDictionary.get('idListOfTables')?.setValue('');
      this.formDictionary.get('idTable')?.setValue('');
      this.formDictionary.get('descriptionTable')?.setValue('');
      this.formDictionary.get('isTableRequired')?.setValue(false);

      this.formDictionary.get('idListOfTables')?.clearValidators();
      this.formDictionary.get('idListOfTables')?.updateValueAndValidity();

      this.formDictionary.get('idTable')?.clearValidators();
      this.formDictionary.get('idTable')?.updateValueAndValidity();

      this.formDictionary.get('descriptionTable')?.clearValidators();
      this.formDictionary.get('descriptionTable')?.updateValueAndValidity();
    }

    this.formDictionary.updateValueAndValidity();
    this.isTableRequired = event.checked;


  }


  trazabilitySaveOrEdit(objetSending: any) {
    let antes;
    let despues;
    if (this.idDataDictionary) {
      let objAnterior: Dictionary = JSON.parse(JSON.stringify(this.currentDictionary));
      const nuevoObj = {
        ...objetSending,
        fullNameUserAction: this.nombreUsuario,
        active: objAnterior.active
      };
      antes = {
        idDataDictionary: objAnterior.idDataDictionary,
        dictionaryName: objAnterior.dictionaryName,
        dictionaryCode: objAnterior.dictionaryCode,
        table: objAnterior.table,
        idListOfTables: objAnterior.idListOfTables,
        tablesId: objAnterior.tablesId,
        descriptions: objAnterior.descriptions,
        active: objAnterior.active,
        fullNameUserAction: objAnterior.fullNameUserAction,
        idUserAction: objAnterior.idUserAction,
      };
      despues = JSON.parse(JSON.stringify(nuevoObj));
      despues.idUserAction = this.idUser;


    } else {
      const nuevoObj = {
        ...objetSending,
        fullNameUserAction: this.nombreUsuario,
      };
      antes = JSON.parse(JSON.stringify(nuevoObj));
    }

    this.idDataDictionary ? this.trazabilidad(antes, despues, 2, 'Edición') : this.trazabilidad(antes, null, 1, 'Creación');
  }


  trazabilidad(antes: Dictionary, despues: Dictionary | null, idMovimiento: number, movimiento: string) {
    const dataTrazabilidad: dataTrazabilidad = {
      datos_actuales: antes,
      datos_actualizados: despues,
      idModulo: 24,
      idMovimiento,
      modulo: "Homologación",
      movimiento,
      subModulo: "Diccionario de datos"
    }
    this.tzs.postTrazabilidad(dataTrazabilidad);
  }

}
