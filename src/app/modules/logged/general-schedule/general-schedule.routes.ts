import { Routes } from "@angular/router";

import { AppointmentManageComponent } from "./appointment-manage/appointment-manage.component";
import { ScheduleAnAppointmentComponent } from "./schedule-an-appointment/schedule-an-appointment.component";

import { permissionsGuard } from "../../../shared/guardianes/permissions.guard";

export const routesGeneralSchedule: Routes = [
  {
    path: 'agendamiento',
    component: ScheduleAnAppointmentComponent,
    canActivate: [permissionsGuard],
    data: { menu: 'Agendar una cita' }
  },
  {
    path: 'admin-reserva',
    loadChildren: () => import('./manage-reserves/manage-reserves.routes').then(r => r.ManageReservesRoutes),
    canActivate: [permissionsGuard],
    data: { menu: 'Administración de reservas' }
  },
  {
    path: 'admin-espacios',
    loadChildren: () => import('./admin-espacios/admin-espacios.routes').then(r => r.AdminEspaciosRoutes),
    canActivate: [permissionsGuard],
    data: { menu: 'Administración de espacios' }
  },
  {
    path: 'admin-citas',
    component: AppointmentManageComponent,
    canActivate: [permissionsGuard],
    data: { menu: 'Administración de citas' }
  },
  {
    path: 'configuracion-agenda',
    loadChildren: () => import('./agenda-config/agendaconfig.routes').then(r => r.ManageAgendaRoutes),
    canActivate: [permissionsGuard],
    data: { menu: 'Configuración de agenda' }
  },
  {
    path: 'historico',
    loadChildren: () => import('./historical scheduling/historical-schedule.routes').then(r => r.HistoricalSheduleRoutes),
    canActivate: [permissionsGuard],
    data: { menu: 'Historico de citas' }
  },
  {
    path: 'citas',
    loadChildren: () => import('./citas/citas.routes').then(r => r.citasRoutes),
    canActivate: [permissionsGuard],
    data: { menu: 'Historico de citas' }
  },
  {
    path: 'actualizar-datos',
    loadChildren: () => import('./data-update/data-update.routes').then(r => r.routesDatapdate),
    canActivate: [permissionsGuard],
    data: { menu: 'Actualización de datos' }
  },
]
