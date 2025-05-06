import { Routes } from "@angular/router";
import { FormFeaturesComponent } from "./form-features/form-features.component";
import { FeaturesComponent } from "./features.component";

export const routesCaracteristicas: Routes = [
  {
    path: '',
    component: FeaturesComponent
  },
  {
    path: 'create',
    component: FormFeaturesComponent  
  },
  {
    path: 'edit/:idCharacteristic',
    component: FormFeaturesComponent  
  }
];
