import { Component, ElementRef, HostListener, Renderer2, TemplateRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { ExamsLaboratoryService } from '@app/services/exams-laboratory/exams-laboratory.service';
import { LoaderService } from '@app/services/loader/loader.service';
import { ModalService } from '@app/services/modal/modal.service';
import { SedesService } from '@app/services/sedes/sedes.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '@app/shared/inputs/toggle/toggle.component';
import { ChangeStatusExam, ExamByNamePage, ExamLaboratory, GetExam, ListChargueExam } from '@app/shared/interfaces/exams-laboratory/exams-laboratory.model';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { debounceTime, distinctUntilChanged, lastValueFrom, Subject, switchMap, takeUntil } from 'rxjs';
import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import * as XLSX from 'xlsx';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-list-exams',
  standalone: true,
  imports: [ToggleComponent, MatTooltipModule, MatIcon, BasicInputComponent, RouterLink, NgxPaginationModule, NgFor],
  templateUrl: './list-exams.component.html',
  styleUrl: './list-exams.component.scss'
})
export class ListExamsComponent {

  permisosDelModulo: any

  cabeceros: string[] = ['Código CUPS', 'Examen de laboratorio', 'Requisitos', 'Estado', 'Editar', 'Eliminar'];
  data: any[] = [];
  requirementsText: any;

  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();

  formSearch = this.fb.group({
    search: [''],
  })
  file: File | null = null;

  paginadorNumber: number = 1;


  pageSize: number = 5;
  pageNumber: number = 0;
  currentPage: number = 1;
  counter: number = 0;

  constructor(
    private tzs: TrazabilidadService,
    private shadedSVC: SharedService,
    private fb: FormBuilder,
    private router: Router,
    private loaderSvc: LoaderService,
    private modalSvc: ModalService,
    private elRef: ElementRef,
    private renderer: Renderer2,
    private dialog: MatDialog,
    private examsSvc: ExamsLaboratoryService
  ) {

    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Exámenes de laboratorio')
  }


  async ngOnInit(): Promise<void> {
    this.filterSearch();
    this.ajustarAlto()
    await this.getListExamsLaboratory(this.currentPage);

  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    this.currentPage = 1;
    setTimeout(() => {
      this.ajustarAlto()
      setTimeout(async () => {
        await this.getListExamsLaboratory(this.currentPage);
      }, 100);
    }, 100)
  }



  async ajustarAlto() {

    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const titulo = this.elRef.nativeElement.querySelector('.titulo').offsetHeight;
    const searchLoad = this.elRef.nativeElement.querySelector('.form-search').offsetHeight;
    let he = container - titulo - searchLoad - 100;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.contenedor-tabla'), 'height', `${he}px`);
    let paginador = he / 25;
    let paginas = Math.floor(paginador / 2);
    this.pageSize = paginas > 5 ? paginas : 5

  }

  async getListExamsLaboratory(pageNumber?: number) {
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando exámenes de laboratorio' })
      let examName = this.formSearch.get('search')?.value || '';

      let objectPaginator: ExamByNamePage = {
        examName,
        pageSize: this.pageSize,
        pageNumber: pageNumber || 1
      }
      if (!pageNumber) this.currentPage = 1;
      let exams = await lastValueFrom(this.examsSvc.getListExamsByNamePage(objectPaginator));
      this.loaderSvc.hide()
      if (exams.ok && exams.data) {
        this.counter = exams.data.RegistrosTotales;
        this.data = exams.data.Examenes.slice(0, this.pageSize);
      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'No se encontraron exámenes', '3')
        this.data = []
        this.currentPage = 1;
      }
    } catch (error) {
      this.modalSvc.openStatusMessage('Aceptar', 'Ocurrio un error al traer los exámenes', '4')

      this.loaderSvc.hide()
    }
  }


  handlePageChange(page: any) {
    this.currentPage = page;
    this.getListExamsLaboratory(page)
  }

  editExam(idExam: any) {
    if (!this.permisosDelModulo.Editar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '3');
      return
    }

    this.router.navigate(['/inicio/parametrizacion/examenes/edit/', idExam]);

  }


  openModalDelete(template: TemplateRef<any>, item: any, titulo: string = '', mensaje: string = '') {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '3');
      return
    }

    titulo = `¿Está seguro que desea eliminar el examen seleccionado?`
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

      await this.deleteExam(item.idExam)
      dialogRef.close();

    });
  }
  async openModalRequirements(template: TemplateRef<any>, idExam: any, titulo: string = '', mensaje: string = '') {
    let r = await this.getRequeriments(idExam);
    if (!r) {
      return
    }

    titulo = ``
    const destroy$: Subject<boolean> = new Subject<boolean>();

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
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '1200px', data, disableClose: true });


  }

  async deleteExam(item: any) {
    try {
      this.loaderSvc.show();
      let r = await lastValueFrom(this.examsSvc.deleteExam(item));
      this.loaderSvc.hide();
      let elemento = this.data.find(e => e.idExam == item);
      let nuevoEvent: GetExam = JSON.parse(JSON.stringify(elemento));
      nuevoEvent.idUserAction = this.idUser;
      nuevoEvent.fullNameUserAction = this.nombreUsuario;
      if (r.ok) {
        this.trazabilidad(nuevoEvent, null, 3, 'Eliminación');
        this.modalSvc.openStatusMessage('Aceptar', `Examen eliminado correctamente`, "1");
        this.currentPage = 1
        await this.getListExamsLaboratory();
      } else {
        if (r.message == "Existe asociacion con elementos") {
          this.modalSvc.openStatusMessage('Aceptar', `No eliminar el examen, existe asociacion con elementos`, "3")
        } else {
          this.modalSvc.openStatusMessage('Aceptar', `Ocurrio un error al eliminar el examen, intente de nuevo`, "4")
        }
      }
    } catch (error) {
      this.modalSvc.openStatusMessage('Aceptar', `Ocurrio un error al eliminar el examen, intente de nuevo`, "4")
      this.loaderSvc.hide();

    }

  }



  async changeStatus(event: any, idExam: number) {
    if (!this.permisosDelModulo.Editar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para editar', '4')
      await this.getListExamsLaboratory();
      return
    }
    let obj: ChangeStatusExam = {
      idEntitie: idExam,
      active: event,
      idUserAction: this.shadedSVC.obtenerIdUserAction()
    }
    let item = this.data.find(e => e.idExam == idExam);

    let antes: GetExam = JSON.parse(JSON.stringify(item));
    let despues: GetExam = JSON.parse(JSON.stringify(item));
    despues.active = event;
    despues.fullNameUserAction = this.nombreUsuario;
    despues.idUserAction = this.idUser;
    try {
      this.loaderSvc.show();
      let r = await lastValueFrom(this.examsSvc.changeStatusExam(obj));
      this.loaderSvc.hide();
      if (r.ok) {
        this.trazabilidad(antes, despues, 2, 'Edición');
        this.modalSvc.openStatusMessage('Aceptar', `Examen ${obj.active ? 'activado' : 'desactivado'} correctamente`, "1")
      } else {
        if (r.message == "Existe asociacion con elementos") {
          this.modalSvc.openStatusMessage('Aceptar', `No se puede cambiar el estado, existe asociacion con elementos`, "3")
        } else if (r.message == 'Examen asociado en citas, no se puede desactivar') {
          this.modalSvc.openStatusMessage('Aceptar', r.message, "3")
        } else {
          this.modalSvc.openStatusMessage('Aceptar', `Ocurrio un error al ${obj.active ? 'activar' : 'desactivar'} el examen, intente de nuevo`, "4")
        }
        this.getListExamsLaboratory(this.currentPage);
      }
    } catch (error) {
      this.modalSvc.openStatusMessage('Aceptar', `Ocurrio un error al ${obj.active ? 'activar' : 'desactivar'} el examen, intente de nuevo`, "4")
      this.loaderSvc.hide();

    }
  }



  filterSearch() {
    this.formSearch.get('search')?.valueChanges
      .pipe(
        debounceTime(600), // Espera 600ms después del último cambio
        distinctUntilChanged(), // Evita ejecutar para valores iguales consecutivos
        switchMap(e => {
          if (e && e.length > 3) {
            return this.getListExamsLaboratory();
          } else {
            return this.getListExamsLaboratory();
          }
          return [];
        })
      )
      .subscribe();
  }


  onFileSelected(event: Event, fileInput: HTMLInputElement): void {

    const input = event.target as HTMLInputElement;

    if (input?.files?.length) {
      this.file = input.files[0];
      this.validateAndParseExcelFile(this.file)

      // Puedes procesar el archivo, por ejemplo, subirlo al servidor
    } else {
      this.modalSvc.openStatusMessage('Aceptar', 'No se cargo ningun archivo', '3')
    }
    fileInput.value = '';
  }
  downloadExcelModel() {
    const data = [
      { CUPS: '', NombreDeExamen: '', Precondición: '', Indicación: '', SexoBiológico: '' },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, worksheet, 'Hoja1');
    XLSX.writeFile(wb, 'Formato_carga_examen.xlsx');
  }



  validateAndParseExcelFile(file: File): void {
    const requiredColumns = [
      'CUPS',
      'NombreDeExamen',
      'Precondición',
      'Indicación',
      'SexoBiológico',
    ];

    const fileReader = new FileReader();
    fileReader.onload = async (event: any) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // Leer la primera hoja del Excel
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir la hoja en un JSON estructurado
      const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // Obtener la fila de encabezados
      const headers = excelData[0];
      if (!headers) {
        this.modalSvc.openStatusMessage('Aceptar', 'El archivo Excel no contiene datos.', '4')
        return;
      }

      // Validar las columnas requeridas
      const missingColumns = requiredColumns.filter((col) => !headers.includes(col));
      if (missingColumns.length > 0) {
        this.modalSvc.openStatusMessage('Aceptar', `Faltan las siguientes columnas en el archivo Excel: ${missingColumns.join(', ')}`, '4')
        return;
      }

      // Índices de las columnas requeridas
      const columnIndices = requiredColumns.map((col) => headers.indexOf(col));

      // Leer las filas y construir el objeto, excluyendo filas vacías
      const listChargueExam = excelData.slice(1) // Excluir encabezados
        .filter((row) => row.some((cell) => cell !== undefined && cell !== null && cell !== '')) // Filtrar filas vacías
        .map((row) => {
          let cups = row[columnIndices[0]].toString()
          return {
            cups: cups || '',
            examName: row[columnIndices[1]] || '',
            preconditions: row[columnIndices[2]] || '',
            indications: row[columnIndices[3]] || '',
            biologicalSex: row[columnIndices[4]] || '',
          };
        });

      // Crear el objeto final
      await this.saveMultiExam(listChargueExam)

    };

    fileReader.onerror = () => {
      this.modalSvc.openStatusMessage('Aceptar', `Error al leer el archivo Excel.`, '4')
    };

    fileReader.readAsArrayBuffer(file);
  }


  async saveMultiExam(listExams: any) {

    if (listExams.length > 0) {
      for (const e of listExams) {
        e.idExam = 0;
        e.cups = String(e.cups)
        e.idExam = 0;
        e.active = true;
        e.dataRemoved = false;
      }
      let list: ListChargueExam = {
        listChargueExam: listExams
      }

      try {
        this.loaderSvc.show();
        let r = await lastValueFrom(this.examsSvc.saveMultiExamsChargue(list));
        this.loaderSvc.hide();
        if (r.ok) {
          if (r.message == 'Ejecion de carga de examenes con errrores') {
            this.modalSvc.openStatusMessage('Aceptar', 'Ocurrio un error al guardar los exámenes desde el excel cargado', '4')
            return
          }
          this.TrazabilityCreteMultiExam(listExams);
          this.modalSvc.openStatusMessage('Aceptar', 'Exámenes cargados correctamente en el sistema', '1')
          await this.getListExamsLaboratory();
        } else {
          this.modalSvc.openStatusMessage('Aceptar', r.message, '4')
        }

      } catch (error) {
        this.loaderSvc.hide();
        this.modalSvc.openStatusMessage('Aceptar', 'Ocurrio un error al guardar los exámenes desde el excel cargado', '4')
      }

    } else {
      this.modalSvc.openStatusMessage('Aceptar', 'El archivo Excel no contiene datos.', '4')
    }

  }



  async getRequeriments(idExam: string) {

    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando lista de requerimientos' })

      let requeriments = await lastValueFrom(this.examsSvc.getRequirementsByExam(idExam));
      this.loaderSvc.hide()
      if (requeriments.ok && requeriments.data) {

        this.requirementsText = {
          preconditions: requeriments.data[0].preconditions,
          indications: requeriments.data[0].indications,
          requirements: requeriments.data[0].listRequirements
        }

        return true

      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'Ocurrio un error al traer los requisitos del examen', '4')
        return false
      }
    } catch (error) {
      this.modalSvc.openStatusMessage('Aceptar', 'Ocurrio un error al traer los requisitos del examen', '4')

      this.loaderSvc.hide()
      return false
    }

  }



  trazabilidad(
    antes: GetExam, despues: GetExam | null, idMovimiento: number, movimiento: string) {

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


  TrazabilityCreteMultiExam(newTraza: any) {
    let obj: any = {
      listExams: newTraza,
      idUserAction: this.idUser,
      fullNameUserAction: this.nombreUsuario,
    }


    this.trazabilidad(obj, null, 1, 'Creación');
  }



}
