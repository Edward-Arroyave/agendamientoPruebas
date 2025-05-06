import { Routes } from "@angular/router";
import { PreparationsComponent } from "./preparations.component";
import { FormPreparationsComponent } from "./form-preparations/form-preparations.component";


export const routesPreparaciones: Routes = [
  {
    path: '',
    component: PreparationsComponent
  },
  {
    path: 'create',
    component: FormPreparationsComponent
  },
  {
    path: 'edit/:idPreparation',
    component: FormPreparationsComponent  
  }
];
