import { Routes } from "@angular/router";
import { RolListComponent } from "./rol-list/rol-list.component";
import { RolPermisosComponent } from "./rol-permisos/rol-permisos.component";
import { RolFormComponent } from "./rol-form/rol-form.component";

export const routesUsuarios: Routes = [
  {
    path: '',
    component: RolListComponent
  },
  {
    path: 'form',
    component: RolFormComponent
  },
  {
    path: 'form/:idRol',
    component: RolFormComponent
  },
  {
    path: 'permisos/:idRol',
    component: RolPermisosComponent
  },


]
