import { Routes } from "@angular/router";
import { CategoryComponent } from "./category/category.component";
import { ElementsComponent } from "./elements/elements.component";
import { FeaturesComponent } from "./features/features.component";
import { PreparationsComponent } from "./preparations/preparations.component";
import { permissionsGuard } from "../../../shared/guardianes/permissions.guard";

export const routesParameterization: Routes = [
    // {
    //     path:'categorias',
    //     component:CategoryComponent
    // },
    {
        path: 'categorias',
        loadChildren: () => import('./category/category.routes').then(r => r.routesCategorias),
        canActivate: [permissionsGuard],
        data: { menu: 'Categorías' }
    },
    {
        path:'especializaciones',
        loadChildren: () => import('./specialization/specialization.routes').then(r => r.routesEspecialidades),
        canActivate: [permissionsGuard],
        data: { menu: 'Especialidades' }
    },
    {
        path:'caracteristicas',
        loadChildren: () => import('./features/features.routes').then(r => r.routesCaracteristicas),
        canActivate: [permissionsGuard],
        data: { menu: 'Características' }
    },
    {
        path:'elementos',
        loadChildren: () => import('./elements/elements.routes').then(r => r.routesElementos),
        canActivate: [permissionsGuard],
        data: { menu: 'Elementos' }
    },
    {
        path:'preparaciones',
        loadChildren: () => import('./preparations/preparations.routes').then(r => r.routesPreparaciones),
        canActivate: [permissionsGuard],
        data: { menu: 'Preparaciones' }
    },
    {
        path:'examenes',
        loadChildren: () => import('./exams-laboratory/exams-laboratory.routes').then(r => r.examsLaboratoryRoutes),
        canActivate: [permissionsGuard],
        data: { menu: 'Exámenes de laboratorio' }
    },

]
