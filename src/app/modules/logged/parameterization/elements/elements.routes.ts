import { Routes } from "@angular/router";
import { ElementsComponent } from "./elements.component";
import { FormElementsComponent } from "./form-elements/form-elements.component";



export const routesElementos: Routes = [
  {
    path: '',
    component: ElementsComponent
  },
  {
    path: 'create',
    component: FormElementsComponent
  },
  {
    path: 'edit/:idElement',
    component: FormElementsComponent 
  }
];
