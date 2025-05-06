import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { inject } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from './autenticacion/auth..service';

const URLactual = window.location.href;
export const listClients = {
  desarrollo: 'BDConnectionDev',
  pruebas: 'BDConnectionTest',
  demo: 'BDConnectionDemo',
  produccion: 'BDConnectionProd',
};
let Cliente = '';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Mover la inyección dentro del interceptor
  const authService = inject(AuthService);
  const router = inject(Router);
  if (req.url.includes('api/Login/refreshToken')) {

    const refreshToken = authService.getTokenRefreshToken()

    if (!refreshToken) {
      authService.logout();
    } else {
      let request = req;
      request = urlRequest(request, refreshToken);
      return next(request); // No modificar la solicitud de refreshToken y continuar con la ejecución
    }


  }
  let request = req;
  const token = sessionStorage.getItem('token');

  if (token) {
    request = urlRequest(request, token);
  } else {
    request = urlRequest(request);
  }

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      return errorHandling(err, request, next, authService, router);
    })
  );
};



function urlRequest(request: any, token?: string) {


  if (URLactual.includes('localhost') || URLactual.includes('https://agendamiento-frontend-c-desarrollo-gjgvdsg8b0a3htc3.eastus2-01.azurewebsites.net')) {
    Cliente = listClients.desarrollo;
  } else if (URLactual.includes('https://agendamiento-frontend-c-pruebas-ehe5c9fyb7gwehed.eastus2-01.azurewebsites.net')) {
    Cliente = listClients.pruebas;
  } else if (URLactual.includes('https://agenda-demo-colcan.ithealth.co')  || URLactual.includes('https://agendamiento-frontend-c-demo-fmfqb3apb8egfnb5.eastus2-01.azurewebsites.net')) {
    Cliente = listClients.demo;
  } else {
    Cliente = listClients.produccion;
  }


  return request.clone({
    setHeaders: {
      Client: Cliente,
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    }
  });
}

function errorHandling(
  httpResponse: HttpErrorResponse,
  request: any,
  next: any,
  authService: AuthService,
  router: Router
): Observable<any> {
  if (httpResponse.error instanceof ErrorEvent) {
    console.error('Error de lado del cliente:', httpResponse?.error.message);
  } else if (window.location.href.includes('inicio') && httpResponse.status !== 0) {
    let isServerError = true;
    let errorMesagge = `Error de solicitud: ${httpResponse.message}`;

    switch (httpResponse.status) {
      case 400:
        return throwError(httpResponse);
      case 401:
        return handle401Error(request, next, authService, router);
      case 404:
        isServerError = httpResponse.error == null;
        errorMesagge = isServerError ? `Servicio: ${httpResponse?.url?.split('/api/')[1]} no existe en el servidor` : httpResponse?.error.Message;
        break;
      case 500:
        errorMesagge = `Error del servidor: ${httpResponse?.error.Message}`;
        break;
    }
  } else {
    console.error('Error del lado del servidor:', httpResponse);
  }
  return throwError(httpResponse);
}

function handle401Error(req: any, next: any, authService: AuthService, router: Router): Observable<any> {

  try {

    let token = authService.getToken();
    if (!token) {
      const username = sessionStorage.getItem('username');
      const remember = sessionStorage.getItem('rememberUser');
      sessionStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('username', String(username));
      sessionStorage.setItem('rememberUser', String(remember));
      sessionStorage.removeItem("token");
      router.navigateByUrl("/login");
    }





    return authService.refreshToken().pipe(
      switchMap((res: any) => {

        authService.setToken(res.data[0]);
        authService.setRefreshToken(res.data[1]);
        const request = urlRequest(req, res.data[0]);
        return next(request);
      }),
      catchError((err) => {

        const username = sessionStorage.getItem('username');
        const remember = sessionStorage.getItem('rememberUser');
        sessionStorage.clear();
        if (username && remember) {
          sessionStorage.setItem('username', String(username));
          sessionStorage.setItem('rememberUser', String(remember));
        }

        sessionStorage.removeItem("token");
        router.navigateByUrl("/login");
        return throwError(err);
      })
    );
  } catch (error) {
    authService.logout();

    return of(null); // Cambia a 'of(null)' para devolver un Observable
  }



}









