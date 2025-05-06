import { Routes } from '@angular/router';
import { authGuard } from './shared/guardianes/auth.guard';

export const routes: Routes = [
    {
        path:'login',
        loadChildren:()=>import('./modules/login/login.routes').then(r => r.routesLogin)
    },
    {
        path:'inicio',
        loadChildren:()=>import('./modules/logged/logged.routes').then(r => r.routesLogged),
        // canActivate: [authGuard]
    },
    {
        path: 'notificacion',
        loadChildren: () => import('./modules/login/notificacion/notificacion.route').then(r => r.routesNotificacionMercadoPago),
        canActivate:[]
    },
    { path: '**', redirectTo: '/login', pathMatch: 'full' },
];
