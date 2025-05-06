import { Routes } from '@angular/router';
import { NotificacionComponent } from './mercado-pago/notificacion.component';

export const routesNotificacionMercadoPago: Routes = [
  {
    path: 'mercadoPago/:idNotificacion',
    component:NotificacionComponent,
    data: { menu: 'Notificaciones' }
  }

]