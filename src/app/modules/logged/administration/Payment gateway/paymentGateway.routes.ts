import { Routes } from '@angular/router';
import { FormPaymentGatewayComponent } from './form-payment-gateway/form-payment-gateway.component';
import { PaymentGatewayComponent } from './payment-gateway/payment-gateway.component';

export const paymentGatewayRoutes: Routes = [
  {
    path: '',
    component: PaymentGatewayComponent
  },
  {
    path: 'form',
    component: FormPaymentGatewayComponent
  },
  {
    path: 'form/:idPaymentGateway',
    component: FormPaymentGatewayComponent
  },
];
