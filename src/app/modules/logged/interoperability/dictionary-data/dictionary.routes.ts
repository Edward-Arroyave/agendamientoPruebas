import { Routes } from "@angular/router";
import { ListDictionaryComponent } from "./list-dictionary/list-dictionary.component";
import { FormDictionaryComponent } from "./form-dictionary/form-dictionary.component";

export const DictionaryRoutes: Routes = [
  {
    path: '',
    component: ListDictionaryComponent,
  },
  {
    path: 'form',
    component: FormDictionaryComponent,

  },
  {
    path: 'form/:idDataDictionary',
    component: FormDictionaryComponent,
  },

]
