import { Routes } from "@angular/router";
import { AdminEspaciosComponent } from "./admin-espacios/admin-espacios.component";

export const AdminEspaciosRoutes: Routes = [
  {
    path: '',
    component:AdminEspaciosComponent,
    // canMatch: [ispatientGuard]
  },


]
