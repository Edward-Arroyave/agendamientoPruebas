import { Routes } from "@angular/router";
import { DataUpdateComponent } from "./data-update.component";
import { FormDataUpdateComponent } from "./form-data-update/form-data-update/form-data-update.component";




export const routesDatapdate: Routes = [
  {
    path: '',
    component: DataUpdateComponent
  },
  {
    path: 'create',
    component: FormDataUpdateComponent
  },
  {
    path: 'edit/:idPatient',
    component: FormDataUpdateComponent 
  }
];
