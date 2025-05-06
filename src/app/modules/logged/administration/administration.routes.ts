import { Routes } from "@angular/router";
import { LogsComponent } from "./logs/logs.component";
import { permissionsGuard } from "../../../shared/guardianes/permissions.guard";


export const routesAdministration: Routes = [
  {
    path: 'trazabilidad',
    component: LogsComponent,
    data: { menu: 'Trazabilidad' }
  },
  {
    path: 'roles-permisos',
    loadChildren: () => import('./rol/rol.routes').then(r => r.routesUsuarios),
    canActivate: [permissionsGuard],
    data: { menu: 'Roles y permisos' }
  },
  {
    path: 'usuarios',
    loadChildren: () => import('./user/user.routes').then(r => r.routesUsuarios),
    canActivate: [permissionsGuard],
    data: { menu: 'Usuarios' }
  },
  {
    path: 'sedes',
    loadChildren: () => import('./sedes/sedes.routes').then(r => r.routesSedes),
    canActivate: [permissionsGuard],
    data: { menu: 'Sedes' }
  },
  {
    path: 'procedencias',
    loadChildren: () => import('./procedencias/procedencias.routes').then(r => r.routesProcedencias),
    canActivate: [permissionsGuard],
    data: { menu: 'Procedencias y entidades' }
  },
  {
    path: 'gateway',
    loadChildren: () => import('./Payment gateway/paymentGateway.routes').then(r => r.paymentGatewayRoutes),
    //canActivate: [permissionsGuard],
    data: { menu: 'Pasarela de pagos' }
  },
]
