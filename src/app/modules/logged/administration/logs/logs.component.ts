import { Component, TemplateRef } from '@angular/core';
import { TablaComunComponent } from '../../../../shared/tabla/tabla-comun/tabla-comun.component';
import { NgClass, AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { BasicInputComponent } from '../../../../shared/inputs/basic-input/basic-input.component';
import { MatDialog } from '@angular/material/dialog';
import { ModalGeneralComponent } from '../../../../shared/modals/modal-general/modal-general.component';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { ModalData } from '../../../../shared/globales/Modaldata';
import { TrazabilidadService } from '../../../../services/trazabilidad/trazabilidad.service';
import { LoaderService } from '../../../../services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import * as XLSX from 'xlsx';
import moment from 'moment';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { DictionaryLogsPipe } from '@app/pipes/logs-dictionary.pipe';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [
    TablaComunComponent,
    MatIcon,
    NgClass,
    MatTooltip,
    MatTooltipModule,
    ReactiveFormsModule,
    BasicInputComponent,
    DictionaryLogsPipe,
    AsyncPipe
  ],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss'
})
export class LogsComponent {


  formSearch = this.fb.group({
    fecha_creacion: ['', Validators.required],
    idModulo: ['', Validators.required],
    fullNameUserAction: [null],
    idMovimiento: [null],
  })


  //Modaal detalle
  traza: any;
  typeTraza: any = 0;
  dataDescripcion: any = 0;
  maxLength: number = 0;

  keysData!: string[];

  valorAnterior: any[] = [];
  valorActual: any;
  diffJson: any[] = [];

  titleDetail: string = ''
  booleanos = [
    { name: 'active', transform: 'Estado' },
    { name: 'particulartime', transform: 'Tiempo particular en minutos' },
    { name: 'medicalhistorydate', transform: 'Fecha de historia médica' },
    { name: 'medicalhistory', transform: 'Historia médica' },
    { name: 'medicalorderdate', transform: 'Fecha de orden médica' },
    { name: 'medicalorder', transform: 'Orden médica' },
    { name: 'medicalauthorization', transform: 'Autorización médica' },
    { name: 'authorizationdate', transform: 'Fecha de autorización' },
  ]
  cabeceros: string[] = ['Fecha de trazabilidad', 'Módulo', 'Submodulo', 'Movimiento', 'Usuario', 'Rol', 'Detalle'];
  trazabilidad: any[] = []
  trazabilidadCopy: any[] = []
  movimientos: any[] = []
  modulos: any[] = []

  constructor(private fb: FormBuilder, private dialog: MatDialog, private trazabilidadSVC: TrazabilidadService, private loaderSvc: LoaderService, private modalSvc: ModalService) {

  }
  async ngOnInit(): Promise<void> {
    await this.getMovimientos();
    await this.getModulos();
  }

  async copiarContenido(texto: string) {
    try {
      if (texto !== null) {
        await navigator.clipboard.writeText(texto);
        this.modalSvc.openStatusMessage('cerrar', 'Usted ha copiado este texto', '1');
      }
    } catch (err) {
    }
  }


  async getMovimientos() {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando movimientos' })
      let items = await this.trazabilidadSVC.getMovements().toPromise();
      if (items.ok && items.data) {
        this.movimientos = items.data
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }
  async getModulos() {

    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando modulos' })
      let items = await lastValueFrom(this.trazabilidadSVC.geModules());
      if (items.ok && items.data) {
        this.modulos = items.data
      }
      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()
    }

  }

  shouldHighlightRow(index: number, countKeys: number): boolean {
    return Math.floor(index / countKeys) % 2 === 0;
  }

  compareJSON(jsonA: any, jsonB: any) {
    const result = [];
    this.typeTraza = jsonB === null ? 1 : 2;

    const processObject = (objA: any, objB: any = null, namePrincipalKey: string = '') => {
      const arrDynamic: any[] = [];
      const keys = new Set([...(objA ? Object.keys(objA) : []), ...(objB ? Object.keys(objB) : [])]);
      keys.forEach((key) => {
        const valueA = objA?.[key] ?? null;
        const valueB = objB?.[key] ?? null;
        const isDifferent = valueA !== valueB;
        arrDynamic.push({ key, valueA, valueB, isDifferent, countKeys: 0, namePrincipalKey });
      });

      return arrDynamic;
    };

    const processArray = (arrA: any[], arrB: any[], namePrincipalKey: string = '') => {
      const arrDynamic: any[] = [];
      const maxLength = Math.max(arrA.length, arrB.length);

      let maxSize = 0;
      for (let i = 0; i < maxLength; i++) {
        const objA = arrA?.[i] !== null ? arrA?.[i] : {};
        const objB = arrB?.[i] !== null ? arrB?.[i] : {};
        const keys = new Set([...(objA ? Object.keys(objA) : []), ...(objB ? Object.keys(objB) : [])]);
        keys.size > maxSize ? maxSize = keys.size : '';
        arrDynamic.push(...processObject(objA, objB, namePrincipalKey));
      }

      return arrDynamic.map(x => { x.countKeys = maxSize; return x });
    };

    for (const key in jsonA) {
      const valueA = jsonA[key];
      const valueB = jsonB?.[key] !== null ? jsonB?.[key] : null;

      if (typeof valueA === 'object' && valueA !== null) {
        if (Array.isArray(valueA)) {
          result.push(processArray(valueA, valueB || [], key));
        } else {
          result.push(processObject(valueA, valueB, key));
        }
      } else {
        const isDifferent = valueA !== valueB;
        result.push({ key, valueA, valueB, isDifferent, countKeys: 0, namePrincipalKey: '' });
      }
    }

    return result;
  };


  openModalAdvanced(template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {

    const destroy$: Subject<boolean> = new Subject<boolean>();
    /* Variables  recibidas por el modal */
    const data: ModalData = {
      content: template,
      btn: 'Aceptar',
      btn2: 'Cerrar',
      footer: true,
      title: titulo,
      type: '',
      message: mensaje,
      image: ''
    };
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '40em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
      dialogRef.close();
    });
  }



  mapearTabla(traza: any[]) {
    this.trazabilidad = traza.map((t: any) => ({
      item1: t.fecha_creacion + ' ' + t.hora,
      item2: t.modulo,
      item3: t.subModulo,
      item4: t.movimiento,
      item5: t.fullNameUserAction,
      item6: t.rolName,
      item7: t, /*Detalle*/

    }));

  }

  formatDate(dateStr: string): string {
    return moment(dateStr).format('l');
  }

  async getTrazaList() {
    try {
      if (this.formSearch.valid) {
        this.trazabilidad = [];
        this.loaderSvc.show()
        this.loaderSvc.text.set({ text: 'Cargando trazabilidad' })
        let filtro = this.formSearch.value;
        const fechaX = moment(filtro.fecha_creacion)
        if (fechaX.toString() !== 'Invalid date') filtro.fecha_creacion = moment(fechaX).format('l');
        let items = await lastValueFrom(this.trazabilidadSVC.getTrazabilidad(filtro));
        if (items.ok && items.data) {
          this.trazabilidadCopy = items.data
          this.mapearTabla(items.data);
        } else {
          this.modalSvc.openStatusMessage('Aceptar', 'No se encontró trazabilidad', '3')
        }
        this.loaderSvc.hide()
      } else {
        this.formSearch.markAllAsTouched();
      }

    } catch (error) {
      this.modalSvc.openStatusMessage('Aceptar', 'Ocurrio un error al consultar la trazabilidad', '4')
      this.loaderSvc.hide()
    }

  }




  abrirModalDetalle(traza: any, template: TemplateRef<any>, titulo: string = '', mensaje: string = '') {
    try {
      this.traza = traza.item7
      this.titleDetail = ''
      this.titleDetail = `El usuario ${this.traza.fullNameUserAction} a ${this.traza.idMovimiento == 1 ? 'creado' : this.traza.idMovimiento == 2 ? 'editado' : 'eliminado'} la siguiente información en el módulo ${this.traza.modulo.toLowerCase()} submodulo ${this.traza.subModulo.toLowerCase()} en la fecha ${this.traza.fecha_creacion.toLowerCase()} - ${this.traza.hora.toLowerCase()}`
      this.keysData = [];

      let diferencias = this.compareJSON(JSON.parse(this.traza.datos_actuales), JSON.parse(this.traza.datos_actualizados));
      //Sacamos los arreglos vacios para evitar errores:
      this.diffJson = diferencias.filter(item => !Array.isArray(item) || item.length > 0);

      const destroy$: Subject<boolean> = new Subject<boolean>();
      /* Variables  recibidas por el modal */
      const data: ModalData = {
        content: template,
        btn: '',
        btn2: 'Cerrar',
        footer: true,
        title: titulo,
        type: '',
        message: mensaje,
        image: ''
      };
      const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '70em', data, disableClose: true });

      dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(x => {
        dialogRef.close();
      });
    } catch (error) {

    }

  }


  eliminarIds(obj: any): any {
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => !key.toLowerCase().startsWith('id') && !key.toLowerCase().endsWith('entity'))
    );
  }

  generarArregloBooleans(obj: any) {
    for (const key in obj) {
      if (obj[key] === false) {
        obj[key] = 'Desactivado'
      }
      if (obj[key] === true) {
        obj[key] = 'Activado'
      }
      if (obj[key] === "") {
        obj[key] = '0';
      }
    }
    return obj;
  }

  generarArregloDetalle(obj: any): any[] {
    return Object.entries(obj).map(([key, value]) => {
      if (value == false) {
        value = 'Desactivado'
      }
      if (value == true) {
        value = 'Activado'
      }
      let valor: any = value;
      if (typeof valor === 'string' && valor.includes(':')) {
        valor = String(valor).split(':')[1].trim();
      }
      if (valor === "" || valor === null) valor = "-";
      return { valor: valor };
    });
  }

  compararDetalle() {
    if (this.valorActual.length) {
      for (let i = 0; i < this.valorActual.length; i++) {
        if (this.valorActual[i].nombre == this.valorAnterior[i].nombre) {
          if (this.valorActual[i].valor != this.valorAnterior[i].valor) {
            this.valorActual[i].diferent = true;
          }
        }

      }
    }

  }


  limpiar() {
    this.trazabilidad = [];
    this.trazabilidadCopy = [];
    this.formSearch.reset();
  }

  descargarTraza() {
    if (this.trazabilidadCopy.length) {
      try {
        this.loaderSvc.show();

        let trazabilidadSinId = [];

        for (const element of this.trazabilidadCopy) {
          let o = this.eliminarIds(element);
          o = this.cambiarTitulos(o);
          trazabilidadSinId.push(o);
        }
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(trazabilidadSinId);
        const columnas = Object.keys(trazabilidadSinId[0] || {});
        worksheet['!cols'] = columnas.map((col) => {
          const maxLength = trazabilidadSinId.reduce((max, row) => {
            const cellValue = row[col] ? row[col].toString() : '';
            return Math.max(max, cellValue.length);
          }, col.length);

          return { wch: maxLength + 2 };
        });

        const workbook: XLSX.WorkBook = {
          Sheets: { 'Sheet1': worksheet },
          SheetNames: ['Sheet1']
        };

        let fecha = this.formSearch.get('fecha_creacion')?.value;
        if (fecha) {
          fecha = this.formatDate(fecha);
        }

        let text = `Trazabilidad${fecha}.xlsx`;
        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = text;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
        this.loaderSvc.hide();
      } catch (error) {
        this.loaderSvc.hide();
        this.modalSvc.openStatusMessage('Aceptar', 'Ocurrió un error al generar el Excel', '4');
      }
    } else {
      this.modalSvc.openStatusMessage('Aceptar', 'Debe consultar la trazabilidad por fecha', '3');
    }
  }

  cambiarTitulos(objeto: any) {
    let cabezeros: any = [];
    return Object.entries(objeto).reduce((acc: any, [key, value]) => {
      let nuevoKey = key;
      switch (key.toLowerCase()) {
        case 'active':
          nuevoKey = 'Estado';
          value = value ? 'Activado' : 'Desactivado';
          break;
        case 'fullnameuseraction':
          nuevoKey = 'Nombre';
          break;
        case 'fecha_creacion':
          nuevoKey = 'Fecha de trazabilidad';
          let valor: any = value;
          value = this.formatDate(valor)
          break;
        case 'hora':
          nuevoKey = 'Hora';
          break;
        case 'modulo':
          nuevoKey = 'Módulo';
          break;
        case 'submodulo':
          nuevoKey = 'Sub-módulo';
          break;
        case 'movimiento':
          nuevoKey = 'Movimiento';
          break;
        case 'rolname':
          nuevoKey = 'Nombre de rol';
          break;
        case 'datos_actuales':
          nuevoKey = 'Datos_actuales';
          if (value) {



            let valor: any = value;
            try {
              let objeto = JSON.parse(valor);


              objeto = this.eliminarIds(objeto);

              cabezeros = Object.entries(objeto).map(([key, value]) => {
                if (this.booleanos.find(e => e.name == key.toLowerCase())) {
                  return this.booleanos.find(e => e.name == key.toLowerCase())?.transform
                }
                return String(value).split(':')[0].trim();
              });
              //reemplazar
              if (cabezeros.length) {
                objeto = Object.entries(objeto).reduce((acc: any, [key, value], index) => {

                  const nuevoKey = cabezeros[index] || key;
                  if (String(value).includes(':')) {
                    value = String(value).split(':')[1].trim();
                  }
                  acc[nuevoKey] = value;
                  return acc;
                }, {});
              }
              value = JSON.stringify(objeto).replace(/["{}]/g, '');
            } catch (error) {
              console.error('Error al analizar el JSON:', error);
              value = null;
            }
          }
          break;
        case 'datos_actualizados':
          nuevoKey = 'Datos_actualizados';
          if (value) {
            let valor: any = value;
            try {
              let objeto = JSON.parse(valor);
              //reemplazar
              if (cabezeros.length) {
                objeto = Object.entries(objeto).reduce((acc: any, [key, value], index) => {
                  objeto = this.eliminarIds(objeto);
                  const nuevoKey = cabezeros[index] || key;
                  if (String(value).includes(':')) {
                    value = String(value).split(':')[1].trim();
                  }
                  acc[nuevoKey] = value;
                  return acc;
                }, {});
              }

              value = JSON.stringify(objeto).replace(/["{}]/g, '');
            } catch (error) {
              console.error('Error al analizar el JSON:', error);
              value = null;
            }
          }
          break;

        default:
          break;
      }
      acc[nuevoKey] = value;
      return acc;
    }, {});
  }
}
