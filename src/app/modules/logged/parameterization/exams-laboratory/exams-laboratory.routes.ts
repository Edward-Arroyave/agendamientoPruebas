import { Routes } from "@angular/router";
import { ListExamsComponent } from "./List-exams/list-exams.component";
import { FormExamsComponent } from "./Form-exams/form-exams.component";

export const examsLaboratoryRoutes: Routes = [
   {
      path: '',
      component: ListExamsComponent
    },
    {
      path: 'add',
      component: FormExamsComponent
    },
    {
      path: 'edit/:idExam',
      component: FormExamsComponent
    }
]
