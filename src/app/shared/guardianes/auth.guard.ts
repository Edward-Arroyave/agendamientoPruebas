import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/autenticacion/auth..service';

export const authGuard: CanActivateFn = (route, state) => {
  const authSvc = inject(AuthService)
  const router = inject(Router)
  let isAutenticate: boolean = false

  const token = authSvc.getToken();
  if (token) {
    isAutenticate = true;
  }
  else {
    isAutenticate = false;
    router.navigateByUrl('/login')
  }

  return isAutenticate;
};
