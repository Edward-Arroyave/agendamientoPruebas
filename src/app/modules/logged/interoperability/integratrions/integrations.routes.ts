import { Routes } from "@angular/router";
import { FormIntegrationsComponent } from "./form-integrations/form-integrations.component";
import { ListIntegrationsComponent } from "./list-integrations/list-integrations.component";

export const IntegrationsRoutes: Routes = [
  {
    path: '',
    component: ListIntegrationsComponent,
  },
  {
    path: 'form',
    component: FormIntegrationsComponent,

  },
  {
    path: 'form/:idIntegration',
    component: FormIntegrationsComponent,
  },

]
