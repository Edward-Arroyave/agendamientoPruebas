import { Routes } from "@angular/router";
import { ManageReservesListComponent } from "./manage-reserves-list/manage-reserves-list.component";
import { ReprogramarComponent } from "./reprogramar/reprogramar.component";
import { ManageReservesPatientComponent } from "./manage-reserves-patient/manage-reserves-patient.component";
import { ispatientGuard } from "@app/shared/guardianes/ispatient.guard";


export const ManageReservesRoutes: Routes = [
  {
    path: '',
    component: ManageReservesPatientComponent,
    canMatch: [ispatientGuard]
  },
  {
    path: '',
    component: ManageReservesListComponent,
  },
   {
    path: 'reprogramar/:status/:idAppointment',
    component: ReprogramarComponent,
  },
 

]
