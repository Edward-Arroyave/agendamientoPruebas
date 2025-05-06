import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  base = '';
  public URLactual = window.location.href;
  private httpClient: HttpClient;

  constructor(private handler: HttpBackend) {
    this.httpClient = new HttpClient(handler);
    this.assingEnviroments()
  }

  static ConfiSettings: any;

  assingEnviroments() {
    let listEnviroments = {
      desarrollo: environment.apiEndPointDev,
      pruebas: environment.apiEndPointTest,
      demo: environment.apiEndPointDemo,
      produccion: environment.apiEndPointProd
    }

    if (this.URLactual.includes('https://agendamiento-frontend-c-pruebas-ehe5c9fyb7gwehed.eastus2-01.azurewebsites.net')) {
      //Pruebas
      this.base = listEnviroments.pruebas
      return
    }
    else if (this.URLactual.includes('https://agenda-demo-colcan.ithealth.co')  || this.URLactual.includes('https://agendamiento-frontend-c-demo-fmfqb3apb8egfnb5.eastus2-01.azurewebsites.net')) {
      //demo
      this.base = listEnviroments.demo
      return
    }
    if (this.URLactual.includes('https://agenda-colcan.ithealth.co')) {
      //produccion
      this.base = listEnviroments.produccion
      return
    }
      this.base = listEnviroments.desarrollo
  }
}
