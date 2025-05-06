import { Routes } from "@angular/router";
import { AgendaConfigListComponent } from "./agenda-config-list/agenda-config-list.component";
import { ispatientGuard } from "@app/shared/guardianes/ispatient.guard";
import { AgendaConfigFormComponent } from "./agenda-config-form/agenda-config-form.component";

export const ManageAgendaRoutes: Routes = [
  {
    path: '',
    component: AgendaConfigListComponent,
  },
  {
    path: 'form',
    component: AgendaConfigFormComponent,

  },
  {
    path: 'form/:idAgenda',
    component: AgendaConfigFormComponent,
  },

]
