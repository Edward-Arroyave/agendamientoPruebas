import { Routes } from "@angular/router";
import { AppVisualComponent } from "./app-visual/app-visual.component";
import { permissionsGuard } from "../../../shared/guardianes/permissions.guard";

export const routesVisual: Routes = [
    {
        path:'confi-visual',
        component:AppVisualComponent,
        canActivate: [permissionsGuard],
        data: { menu: 'Aplicativo de HealthBook' }
    }
]
