import { Routes } from "@angular/router";

import { CategoryComponent } from "./category.component";
import { FormCategoryComponent } from "./form-category/form-category/form-category.component";

export const routesCategorias: Routes = [
  {
    path: '',
    component: CategoryComponent
  },
  {
    path: 'create',
    component: FormCategoryComponent  
  },
  {
    path: 'edit/:idCategory',
    component: FormCategoryComponent  
  }
];
