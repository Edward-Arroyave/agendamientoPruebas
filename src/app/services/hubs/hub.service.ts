import { authInterceptor, listClients } from './../auth.interceptor';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ConfigService } from '../config/config.service';

@Injectable({
  providedIn: 'root'
})
export class HubService {


  hub: signalR.HubConnection | null = null;  // Inicializar con null
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentURL = ''

  constructor(private config: ConfigService) {


  }
  public connectToSocket() {
    // this.currentURL = this.config.base;
    // let url = `${this.currentURL}/SR`; // Asegúrate de que la URL sea correcta

    // // Asegúrate de que el token esté presente
    // const token = sessionStorage.getItem('token');
    // if (!token) {
    //   console.error("Token no disponible");
    //   return;
    // }
    // try {
    //   this.hub = new signalR.HubConnectionBuilder()
    //     .withUrl(url, {
    //       // transport: signalR.HttpTransportType.WebSockets,
    //       accessTokenFactory: () => token,
    //       headers: {
    //         Client: this.getClient(),
    //       },
    //     })
    //     .withAutomaticReconnect([0, 1000, 2000, 3000, 4000, 5000])
    //     .build();

    //   this.startConnection();
    //   this.setupReconnectionHandling();
    // } catch (error) {

    // }

  }

  private startConnection() {
    this.hub?.start()
      .then(() => {
     //   console.log('✅ Conectado a SignalR');
        this.reconnectAttempts = 0; // Reiniciar intentos de reconexión
      })
      .catch(error => {
     //   console.error('❌ Error al conectar con SignalR:', error.message);
        this.scheduleReconnect();
      });
  }

  private setupReconnectionHandling() {
    this.hub?.onclose(async () => {
      console.warn('⚠️ Conexión perdida. Intentando reconectar...');
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('⛔ Máximo de intentos de reconexión alcanzado. No se intentará más.');
      return;
    }

    const delay = (this.reconnectAttempts + 1) * 3000; // Retraso creciente: 3s, 6s, 9s...
    this.reconnectAttempts++;

    setTimeout(() => {
      if (this.hub?.state !== signalR.HubConnectionState.Connected) {
        console.log(`🔄 Intentando reconexión #${this.reconnectAttempts}...`);
        this.startConnection();
      }
    }, delay);
  }

  on(method: string, callback: (message: any) => void) {
    this.hub?.on(method, callback);
  }

  getClient() {
    let clients = listClients;
    if (this.currentURL) {
      if (this.currentURL.includes('localhost') || this.currentURL.includes('https://agendamiento-frontend-c-desarrollo-gjgvdsg8b0a3htc3.eastus2-01.azurewebsites.net')) {
        return clients.desarrollo;
      } else if (this.currentURL.includes('https://agendamiento-frontend-c-pruebas-ehe5c9fyb7gwehed.eastus2-01.azurewebsites.net')) {
        return clients.pruebas;
      } else if (this.currentURL.includes('https://agenda-demo-colcan.ithealth.co')  || this.currentURL.includes('https://agendamiento-frontend-c-demo-fmfqb3apb8egfnb5.eastus2-01.azurewebsites.net')){
        return clients.demo;
      } else {
        return listClients.produccion;
      }
    } else {
      return '';
    }
  }


}

