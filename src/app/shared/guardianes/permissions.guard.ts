import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/autenticacion/auth..service';
import { ModalService } from '../../services/modal/modal.service';

export const permissionsGuard: CanActivateFn = (route, state) => {

  const authSvc = inject(AuthService)
  const router = inject(Router)
  const modal = inject(ModalService)

  const rutaActual = route.routeConfig?.path;
  const permisos = authSvc.getMenuByUser();
  const menu = route.data['menu'];


  for (const menuPadre of permisos) {
    let hijo = menuPadre.Children.find((options:any) => options.Name == menu);
    if(hijo){
      if(!hijo.Ver){

        router.navigateByUrl('/inicio')
        modal.openStatusMessage('Aceptar', '¡No tiene permisos para ver este módulo!', "4")
        return false
        break
      }
    }
  }
  return true;
};
