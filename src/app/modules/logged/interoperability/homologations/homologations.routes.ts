import { Routes } from '@angular/router';
import { ListHomologationsComponent } from './list-homologations/list-homologations.component';
import { FormHomologationsComponent } from './form-homologations/form-homologations.component';

export const HomologationsRoutes: Routes = [
  {
    path: '',
    component: ListHomologationsComponent,
  },
  {
    path: 'form',
    component: FormHomologationsComponent,

  },
  {
    path: 'form/:idHomologation',
    component: FormHomologationsComponent,
  },

]
