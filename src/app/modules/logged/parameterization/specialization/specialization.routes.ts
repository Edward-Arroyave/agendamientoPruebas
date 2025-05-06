import { Routes } from "@angular/router";
import { FormSpecializationComponent } from "./form-specialization/form-specialization.component";
import { SpecializationComponent } from "./specialization.component";

export const routesEspecialidades: Routes = [
  {
    path: '',
    component: SpecializationComponent
  },
  {
    path: 'create',
    component: FormSpecializationComponent  
  },
  {
    path: 'edit/:idSpecialties',
    component: FormSpecializationComponent  
  }
];
