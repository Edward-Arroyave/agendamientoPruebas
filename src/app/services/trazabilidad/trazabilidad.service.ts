import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { lastValueFrom, Observable } from 'rxjs';
import { ConsultSchedulingTrazabilityModel, createSchedulingTrazabilityModel, dataTrazabilidad, trazabilidadModel } from '@app/shared/interfaces/trazabilidad/trazabilidad.model';
import { SharedService } from '../servicios-compartidos/shared.service';
import moment from 'moment';
import { RolesService } from '../roles/roles.service';
import { Rol } from '@app/shared/interfaces/roles/roles.model';
import { LoaderService } from '../loader/loader.service';

@Injectable({
  providedIn: 'root'
})
export class TrazabilidadService {

  role!: Rol;

  constructor(private rolService: RolesService, private shadedSVC: SharedService, private http: HttpClient, private cs: ConfigService, private loaderSvc: LoaderService) { }


  async rolesfn(idRol: number) {
    let resp = await lastValueFrom(this.rolService.getRolById(idRol));
    if (resp.ok) {
      const data: Rol = resp.data[0];
      return data.roleName;
    }
    return "";
  }

  async postTrazabilidad(data: dataTrazabilidad) {
    const newData: trazabilidadModel = {
      idUserAction: this.shadedSVC.obtenerIdUserAction(),
      fullNameUserAction: this.shadedSVC.obtenerNameUserAction(),
      fecha_creacion: moment().format('l'),
      hora: moment().format('LT'),
      idRol: this.shadedSVC.obtenerIdRol(),
      rolName: await this.rolesfn(this.shadedSVC.obtenerIdRol()),
      ...data
    }
    return await lastValueFrom(this.http.post(`${this.cs.base}api/trazabilidad/crear`, newData));
  }

  getTrazabilidad(filtros: any): Observable<any> {
    return this.http.post(`${this.cs.base}api/Trazabilidad`, filtros)
  }
  getMovements(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Trazabilidad/movimientos`)
  }
  geModules(): Observable<any> {
    return this.http.get(`${this.cs.base}api/Trazabilidad/modulos`)
  }


  //Trazabilidad de historico de citas

  async crearTrazabilidadCitaHistorico(documentNumber: string, attentionCenter: number, nameUserAction: string, action: number, appointmentDate: string | Date, appointmentHour: string, internalCode_ElementName: string, idAppointment: number) {

    const updatedAppointmentDate = moment(appointmentDate).add(5, 'hours');
    const [hour, minute] = appointmentHour.split(':').map(Number);

    // Usamos hora Colombia explícita
    const dateAppointment = moment(updatedAppointmentDate)
      .set({ hour, minute, second: 0, millisecond: 0 });

    // Formatear como string plano (sin zona horaria)
    const formattedDateAppointment = dateAppointment.format('YYYY-MM-DD HH:mm');

    let dateFlow = moment.utc(formattedDateAppointment).format();




    //Hora y fecha actual
    const now = moment();
    const formattedNow = now.format('YYYY-MM-DD HH:mm');
    const createdDate = moment.utc(formattedNow, 'YYYY-MM-DD HH:mm').format();




    const date = new Date(createdDate);

    // Aumentar 5 horas
    date.setHours(date.getHours() + 5);
    // Formatear a hora colombiana
    const options: any = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    const createdHour = date.toLocaleTimeString('es-CO', options);


    try {
      this.loaderSvc.show()
      this.loaderSvc.text.set({ text: 'Guardando historico de cita' })
      let objectPaginator: createSchedulingTrazabilityModel = {
        documentNumber,
        createdDate,
        createdHour,
        attentionCenter,
        nameUserAction,
        action,
        appointmentDate: dateFlow,
        internalCode_ElementName,
        idAppointment,
      }

      let i: any = await lastValueFrom(this.createSchedulingTraza(objectPaginator));

      this.loaderSvc.hide()

    } catch (error) {
      this.loaderSvc.hide()
    }
  }
  createSchedulingTraza(scheduling: createSchedulingTrazabilityModel): Observable<any> {
    return this.http.post(`${this.cs.base}api/Trazabilidad/crearCita`, scheduling)
  }

  //Trazabilidad de historico de citas consulta
  consultSchedulingTraza(scheduling: ConsultSchedulingTrazabilityModel): Observable<any> {
    return this.http.post(`${this.cs.base}api/Trazabilidad/obtenerCita`, scheduling)
  }


}
