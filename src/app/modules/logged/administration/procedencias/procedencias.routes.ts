import { Routes } from "@angular/router";
import { ListaProcedenciasComponent } from "./lista-procedencias/lista-procedencias.component";

export const routesProcedencias: Routes = [
    {
        path: '',
        component: ListaProcedenciasComponent,
        title: 'Procedencias y entidades'
    },
    {
        path: 'form',
        loadComponent: () => import('./formulario-procedencia/formulario-procedencia.component').then(c => c.FormularioProcedenciaComponent),
        title: 'Agregar procedencia'
    },
    {
        path: 'form/:idProcedencia',
        loadComponent: () => import('./formulario-procedencia/formulario-procedencia.component').then(c => c.FormularioProcedenciaComponent),
        title: 'Editar procedencia'
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];