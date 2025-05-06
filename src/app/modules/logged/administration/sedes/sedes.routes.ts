import { SedesFormComponent } from './sedes-form/sedes-form.component';
import { SedesListComponent } from './sedes-list/sedes-list.component';
import { Routes } from "@angular/router";

export const routesSedes: Routes = [
  {
    path: '',
    component: SedesListComponent
  },
  {
    path: 'form',
    component: SedesFormComponent
  },
  {
    path: 'form/:idSede',
    component: SedesFormComponent
  },
]
