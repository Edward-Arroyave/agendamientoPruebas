import { LoaderService } from '@app/services/loader/loader.service';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Renderer2, TemplateRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { BasicInputComponent } from '@app/shared/inputs/basic-input/basic-input.component';
import { ToggleComponent } from '@app/shared/inputs/toggle/toggle.component';
import { ModalService } from '@app/services/modal/modal.service';
import { ConfigAgendaService } from '@app/services/servicios-agendamiento/config-agenda/config-agenda.service';
import { SharedService } from '@app/services/servicios-compartidos/shared.service';
import { ModalData } from '@app/shared/globales/Modaldata';
import { ModalGeneralComponent } from '@app/shared/modals/modal-general/modal-general.component';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { NgClass, } from '@angular/common';

import { dataTrazabilidad } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { TrazabilidadService } from '@app/services/trazabilidad/trazabilidad.service';

@Component({
  selector: 'app-agenda-config-list',
  standalone: true,
  imports: [MatIcon, ReactiveFormsModule, BasicInputComponent, RouterLink, ToggleComponent, MatTooltipModule, NgClass],
  templateUrl: './agenda-config-list.component.html',
  styleUrl: './agenda-config-list.component.scss'
})
export class AgendaConfigListComponent {


  listConfig: any = [];
  listConfigCopy: any = [];
  permisosDelModulo: any
  formSearch = this.fb.group({
    search: [''],
  })

  //Variebles para los iconos
  parametros: any[] = []
  parametrosElementos = ''
  dataDetalleConfig: any[] = []
  tiposAtencion: any[] = [{ id: 1, name: 'Presencial', checked: false, }, { id: 2, name: 'Virtual', checked: false, }];
  nombreUsuario: string = this.shadedSVC.obtenerNameUserAction();
  idUser: number = this.shadedSVC.obtenerIdUserAction();
  constructor(
    private loaderSvc: LoaderService, private router: Router,
    private modalSvc: ModalService, private configAgendaSvc: ConfigAgendaService,
    private fb: FormBuilder, private shadedSVC: SharedService,
    private elRef: ElementRef, private renderer: Renderer2,
    private dialog: MatDialog, private tzs: TrazabilidadService,
  ) {
    this.permisosDelModulo = shadedSVC.obtenerPermisosModulo('Configuración de agenda')
  }



  ngAfterViewInit() {
    this.ajustarAlto();
  }

  async ngOnInit(): Promise<void> {


    this.filterSearch();
    await this.traerConfiguraciones()


  }

  @HostListener('window:resize', ['$event'])
  Resolucion(event: any): void {
    setTimeout(() => {
      this.ajustarAlto()
    }, 100)
  }

  filterSearch() {
    this.formSearch.get('search')?.valueChanges.subscribe(e => {
      if (e) {
        this.listConfig = this.listConfigCopy.filter((item: any) => this.searchWithWork(e, item));
      } else {
        this.listConfig = this.listConfigCopy
      }
    })
  }

  searchWithWork(word: string, item: any) {
    let wordLowerCase = word.toLowerCase().toString().trim();
    return item.attentionCenterName.toLowerCase().includes(wordLowerCase.trim()) ||
      item.code.toString().toLowerCase().includes(wordLowerCase.trim()) ||
      item.creationDate.toLowerCase().includes(wordLowerCase.trim())
  }





  private ajustarAlto() {
    const container = this.elRef.nativeElement.querySelector('.container').offsetHeight;
    const header = this.elRef.nativeElement.querySelector('.title').offsetHeight;
    const search = this.elRef.nativeElement.querySelector('.cont-form').offsetHeight;
    let he = container - header - search - 30;
    this.renderer.setStyle(this.elRef.nativeElement.querySelector('.agendas-content'), 'height', `${he}px`);
  }

  async traerConfiguraciones() {

    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando configuraciones' })
      this.listConfig = [];
      this.listConfigCopy = [];
      let word = this.formSearch.get('search')?.value
      let r = await lastValueFrom(this.configAgendaSvc.getConfigAgenda({ parameter: '' }))
      if (r.ok) {

        this.listConfigCopy = r.data.slice()

        this.listConfig = r.data.map((e: any) => {
          e.creationDate = this.formatDate(e.creationDate)
          return e;
        }).filter((item: any) => !word || this.searchWithWork(word, item));

      }

      this.loaderSvc.hide()
    } catch (error) {
      this.loaderSvc.hide()

    }
  }


  editar(idAgenda: number) {
    this.router.navigate([`/inicio/agenda-general/configuracion-agenda/form/${idAgenda}`])
  }
  async cambiarEstado(estado: any, idAgenda: number) {

    try {
      let estadoObj = {
        idAgenda: idAgenda,
        active: estado
      }

      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cambiando estado' })

      let r = await this.configAgendaSvc.UpdateStateAgenda(estadoObj).toPromise()
      this.loaderSvc.hide()
      if (r.ok) {
        //Trazabilidad
        let configuracion = this.listConfig.find((e: any) => e.idAgenda == idAgenda);
        let antes: any = JSON.parse(JSON.stringify(configuracion));
        let despues: any = JSON.parse(JSON.stringify(configuracion));
        despues.active = estado;
        despues.fullNameUserAction = this.nombreUsuario;
        despues.idUserAction = this.idUser;
        this.trazabilidad(antes, despues, 2, 'Edición');
        //Fin trazabilidad
        this.modalSvc.openStatusMessage('Aceptar', `Se ha ${estadoObj.active ? 'activado' : 'desactivado'} la configuración`, '1')
        let itemCopy = this.listConfigCopy.find((e: any) => e.idAgenda == idAgenda)
        if (itemCopy) itemCopy.active = estado;


      } else {


        if (r.message == 'No se puede desactivar agenda, Citas registradas sobre agenda') {
          this.modalSvc.openStatusMessage('Aceptar', `No es posible ${estadoObj.active ? 'activar' : 'desactivar'} la configuración, existen citas registradas.`, '3')
          await this.traerConfiguraciones();
          return
        }
        this.modalSvc.openStatusMessage('Aceptar', `Ha ocurrido un error al ${estadoObj.active ? 'activar' : 'desactivar'} la configuración`, '3')
        await this.traerConfiguraciones();
      }
    } catch (error) {
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', `Ha ocurrido un error al cambiar el estado de la configuración`, '4')
      await this.traerConfiguraciones();
    }

  }

  modalEliminar(template: TemplateRef<any>, item: any, titulo: string = '', mensaje: string = '') {
    if (!this.permisosDelModulo.Eliminar) {
      this.modalSvc.openStatusMessage('Aceptar', 'No cuenta con permisos para eliminar', '3');
      return
    }

    titulo = `¿Está seguro que desea eliminar la configuación de agenda?`
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

      await this.eliminar(item)
      dialogRef.close();

    });
  }

  async modalGeneral(template: TemplateRef<any>, item: any, type: string, titulo: string = '', mensaje: string = '') {


    let detalle;
    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Cargando detalle' })
      let r = await this.configAgendaSvc.getDetailConfigAgenda(item.idAgenda).toPromise();
      this.loaderSvc.hide()
      if (r.ok) {
        detalle = r.data;
      } else {
        this.modalSvc.openStatusMessage('Aceptar', 'Error al traer el detalle', '4')
        return
      }

    } catch (error) {
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', 'Error al traer el detalle', '4')
      return
    }

    if (type == 'p') {
      await this.cargarParametros(detalle.generalDetails)
    } else {
      await this.cargarDetalleconfiguracion(detalle.configurationsDetails)
    }

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
    const dialogRef = this.dialog.open(ModalGeneralComponent, { height: 'auto', width: '48em', data, disableClose: true });

    dialogRef.componentInstance.primaryEvent?.pipe(takeUntil(destroy$)).subscribe(async x => {


      dialogRef.close();

    });
  }


  async eliminar(item: any) {

    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'eliminando configuración' })
      let r = await this.configAgendaSvc.deleteConfigAgenda(item).toPromise()
      this.loaderSvc.hide()
      if (r.ok) {
        let configuracion = this.listConfig.find((e: any) => e.idAgenda == item);
        let nuevoEvent: any = JSON.parse(JSON.stringify(configuracion));
        nuevoEvent.idUserAction = this.idUser;
        nuevoEvent.fullNameUserAction = this.nombreUsuario;
        this.trazabilidad(nuevoEvent, null, 3, 'Eliminación');
        this.modalSvc.openStatusMessage('Aceptar', `Se ha eliminado la configuración`, '1')
        this.listConfigCopy = this.listConfigCopy.filter((a: any) => a.idAgenda != item)
        await this.traerConfiguraciones();
      } else {
        if (r.message.includes("No es posible eliminar")) {
          this.modalSvc.openStatusMessage('Aceptar', r.message, '4')
        } else if (r.message.includes("No se puede eliminar agenda")) {
          this.modalSvc.openStatusMessage('Aceptar', r.message, '4')
        } else {
          this.modalSvc.openStatusMessage('Aceptar', `Ha ocurrido un problema al eliminar la configuración`, '4')
        }


      }


    } catch (error) {
      this.loaderSvc.hide()
      this.modalSvc.openStatusMessage('Aceptar', `Ha ocurrido un error al eliminar la configuración`, '4')
    }

  }

  async cargarParametros(item: any) {
    let tiposAtencion = ''

    if (item.idTypeAttention && item.idTypeAttention) {
      let arreglo = item.idTypeAttention.split(',')
      if (arreglo.length > 0) {
        tiposAtencion = arreglo
          .map((e: any) => this.tiposAtencion.find(x => x.id == e)?.name)
          .join(', ');
      }
    }

    this.parametros = [
      {
        name: 'País',
        icon: 'pais',
        cont: item.country
      },
      {
        name: 'Departamento',
        icon: 'departamento',
        cont: item.department
      },
      {
        name: 'Ciudad',
        icon: 'cuidad',
        cont: item.city
      },
      {
        name: 'Sede',
        icon: 'sede',
        cont: item.attentionCenter
      },
      {
        name: 'Categoría',
        icon: 'categoria',
        cont: item.category
      },
      {
        name: 'Especialidad',
        icon: 'especialidad',
        cont: item.specialties
      },
      {
        name: 'Caracteristica',
        icon: 'caracteristica',
        cont: item.characteristic
      },
      // {
      //   name: 'Condición especial',
      //   icon: 'condicion-especial',
      //   cont: item.specialCondition
      // },
      {
        name: 'Tipo de atención',
        icon: 'tipoAtencion',
        cont: tiposAtencion
      }
    ]

    let param = ""
    if (item.elements && item.elements.length) {
      for (const e of item.elements) {
        param += ` / ${e.elementName}`
      }
    } else {
      param = 'Sin elementos'
    }

    this.parametrosElementos = param
  }

  async cargarDetalleconfiguracion(item: any) {

    this.dataDetalleConfig = []

    // 'Horario de atención',

    this.dataDetalleConfig.push({
      name: 'Horario de atención',
      items: [{
        name: 'Rango de fecha',
        icon: 'fecha-normal',
        cont: `${this.formatDate(item.startDate)} - ${this.formatDate(item.endDate)}`
      },
      {
        name: 'Rango de hora',
        icon: 'reloj',
        cont: `${item.startTime.slice(0, -3)} - ${item.endTime.slice(0, -3)}`
      },
      {
        name: 'Días de aplicación',
        icon: 'Calendario',
        cont: item.daysAttention
      },
      {
        name: 'Hora de intermedio',
        icon: 'reloj',
        cont: item.intermediate ? `${item.fromInter.slice(0, -3)} - ${item.untilInter.slice(0, -3)}` : 'Sin intermedio'
      },
      ]

    },)


    // 'Horario de bloqueo',

    if (item.blockingTimes && item.blockingTimes.length) {

      const groupedBlockingTimes = item.blockingTimes.reduce((acc: any, curr: any) => {
        const { blockDate, startTime, endTime, hourlyBlocking } = curr;

        // Si el bloque de fecha ya existe, agregamos el nuevo tiempo
        if (acc[blockDate]) {
          acc[blockDate].push(`${hourlyBlocking ? startTime.slice(0, -3) + '-' + endTime.slice(0, -3) : 'Todo el día'}`);
        } else {
          // Si no existe, creamos el array con el primer valor de tiempo
          acc[blockDate] = [`${hourlyBlocking ? startTime.slice(0, -3) + '-' + endTime.slice(0, -3) : 'Todo el día'}`];
        }

        return acc;
      }, {} as Record<string, string[]>);

      // Transformamos el resultado en un arreglo con el formato deseado
      const result = Object.keys(groupedBlockingTimes).map(blockDate => ({
        blockDate,
        times: groupedBlockingTimes[blockDate].join(', ')
      }));





      let horarios: any = []
      for (const element of result) {

        let obj = {
          name: 'Fecha bloqueada',
          icon: 'fecha-normal',
          cont: this.formatDate(element.blockDate),
          name2: 'Parametro de bloqueo',
          icon2: 'Parametros',
          cont2: element.times
        }
        horarios.push(obj)
      }

      this.dataDetalleConfig.push({
        name: 'Horario de bloqueo',
        items: horarios
      })
    }



    // 'Bloquedos V.I.P',



    if (item.blockingVip && item.blockingVip.length) {

      const grupedByOrigins = item.blockingVip.reduce((acc: any, curr: any) => {
        const { idOriginEntity, origin, startDate, endDate, startTime, endTime } = curr;
        const dateKey = `${this.formatDate(startDate)} al ${this.formatDate(endDate)}`;

        // Si el idOriginEntity ya existe, verificamos si la fecha ya está en el array de tiempos
        if (acc[idOriginEntity]) {
          const existingDate = acc[idOriginEntity].times.find((entry: any) => entry.date === dateKey);

          if (existingDate) {
            // Si la fecha ya existe, concatenamos los tiempos
            existingDate.times.push(`${startTime.slice(0, -3)} - ${endTime.slice(0, -3)}`);
          } else {
            // Si no, agregamos una nueva entrada para la fecha
            acc[idOriginEntity].times.push({
              date: dateKey,
              times: [`${startTime.slice(0, -3)} - ${endTime.slice(0, -3)}`]
            });
          }
        } else {
          // Si no existe, creamos la entrada con el array de tiempos y guardamos el origin
          acc[idOriginEntity] = {
            origin,
            times: [{
              date: dateKey,
              times: [`${startTime.slice(0, -3)} - ${endTime.slice(0, -3)}`]
            }]
          };
        }

        return acc;
      }, {} as Record<string, { origin: string, times: { date: string, times: string[] }[] }>);

      // Transformamos el resultado en un arreglo con el formato deseado
      const result = Object.keys(grupedByOrigins).map(idOriginEntity => ({
        idOriginEntity,
        origin: grupedByOrigins[idOriginEntity].origin,
        times: grupedByOrigins[idOriginEntity].times.map((entry: any) =>
          `${entry.date} ⦿ ${entry.times.join(', ')}`
        ).join(' ⦿ ')
      }));





      let horariosVip: any = []
      for (const vip of result) {

        let obj = {
          name: 'Procedencia',
          icon: 'entidad',
          cont: vip.origin ? vip.origin : 'No se encontro procedencia',
          name2: 'Bloqueos agregados',
          icon2: 'vip',
          cont2: vip.times

        }

        horariosVip.push(obj)

      }

      this.dataDetalleConfig.push({
        name: 'Bloqueos V.I.P.',
        items: horariosVip
      })
    }

    /* HORARIOS ESPECIALES */

    if (item.specialSchedule && item.specialSchedule.length) {

      let specials = '';

      for (const esp of item.specialSchedule) {
        let string = `/ ${esp.specialDay} ⦿ ${esp.startTime.slice(0, -3)} - ${esp.endTime.slice(0, -3)} `;
        if (esp.fromInter && esp.endInter) {
          string += `Intermedio: ${esp.fromInter.slice(0, -3)} - ${esp.endInter.slice(0, -3)} `
        }
        specials += string;
      }
      specials = specials.slice(1, specials.length)

      let obj = {
        name: 'Horarios agregados',
        icon: 'entidad',
        cont: specials,
      }


      this.dataDetalleConfig.push({
        name: 'Horarios especiales',
        items: [obj]
      })

    }



  }


  formatDate(dateStr: string): string {
    const fecha = new Date(dateStr);

    // Formatear la fecha en el formato "dd-MM-yyyy"
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();

    return `${dia}-${mes}-${año}`;
  }



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


}
