import { Routes } from '@angular/router';

export const interoperabilityRoutes: Routes = [
  {
    path: 'integraciones',
    loadChildren: () => import('./integratrions/integrations.routes').then(r => r.IntegrationsRoutes),
   // canActivate: [permissionsGuard],
    data: { menu: 'Integraciones' }
  },
  {
    path: 'diccionario',
    loadChildren: () => import('./dictionary-data/dictionary.routes').then(r => r.DictionaryRoutes),
   // canActivate: [permissionsGuard],
    data: { menu: 'Diccionario de datos' }
  },
  {
    path: 'homologaciones',
    loadChildren: () => import('./homologations/homologations.routes').then(r => r.HomologationsRoutes),
   // canActivate: [permissionsGuard],
    data: { menu: 'Homologaciones' }
  },
  {
    path: 'monitor',
    loadChildren: () => import('./monitor&Control/Monitor-Control.routes').then(r => r.MonitorRoutes),
   // canActivate: [permissionsGuard],
    data: { menu: 'Monitor y control' }
  },

]
