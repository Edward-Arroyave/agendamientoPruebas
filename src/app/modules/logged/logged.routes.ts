import { Routes } from '@angular/router';
import { LoggedComponent } from './logged.component';
import { InicioComponent } from './inicio/inicio.component';

export const routesLogged: Routes = [
  {
    path: '', component: LoggedComponent,
    children: [
      { path: '', component: InicioComponent, data: { titulo: 'Inicio' } },

      {
        path: 'administracion',
        loadChildren: () => import('./administration/administration.routes').then(r => r.routesAdministration),
      },
      {
        path: 'agenda-general',
        loadChildren: () => import('./general-schedule/general-schedule.routes').then(r => r.routesGeneralSchedule),
      },
      {
        path: 'parametrizacion',
        loadChildren: () => import('./parameterization/parameterization.routes').then(r => r.routesParameterization),
      },
      {
        path: 'cambio-visual',
        loadChildren: () => import('./visual-config/visual-config.routes').then(r => r.routesVisual),
      },
      {
        path: 'interoperabilidad',
        loadChildren: () => import('./interoperability/interoperability.routes').then(r => r.interoperabilityRoutes),
      }
    ]
  },

];
// 