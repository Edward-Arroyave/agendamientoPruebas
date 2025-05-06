import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from '@app/services/autenticacion/auth..service';

export const ispatientGuard: CanMatchFn = (route, segments) => {


  const authSvc = inject(AuthService)

  let tokenDecoded = authSvc.decodeToken()
  if (tokenDecoded && tokenDecoded.IdPatient[1] && tokenDecoded.IdPatient[1] != "0") {
    return true
  }
  return false;
};
