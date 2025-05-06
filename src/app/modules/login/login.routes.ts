import { Routes } from '@angular/router';
import { EjemplosComponent } from './ejemplos/ejemplos.component';
import { LogeoComponent } from './logeo/logeo.component';
import { RegisterComponent } from './register/register.component';

export const routesLogin: Routes = [
    {
        path:'ejemplos',
        component:EjemplosComponent,
        canActivate:[]
    },
    {
        path:'ingreso',
        component:LogeoComponent,
        canActivate:[]
    },
    {
        path:'ingreso/:code',
        component:LogeoComponent,
        canActivate:[]
    },
    {
        path:'registro',
        component:RegisterComponent,
        canActivate:[]
    },
    { path: '**', redirectTo: '/login/ingreso', pathMatch: 'full' },
];
