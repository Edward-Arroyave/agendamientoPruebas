import { Routes } from "@angular/router";
import { FormUserComponent } from "./form-user/form-user.component";
import { PermisosUsuarioComponent } from "./permisos-usuario/permisos-usuario.component";
import { ListUserComponent } from "./list-user/list-user.component";

export const routesUsuarios: Routes = [
  {
    path: '',
    component: ListUserComponent
  },
  {
    path: 'form',
    component: FormUserComponent
  },
  {
    path: 'form/:idUser',
    component: FormUserComponent
  },
  {
    path: 'permisos/:idUser',
    component: PermisosUsuarioComponent
  },

]
