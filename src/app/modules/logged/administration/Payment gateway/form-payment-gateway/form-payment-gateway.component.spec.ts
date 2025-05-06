import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPaymentGatewayComponent } from './form-payment-gateway.component';

describe('FormPaymentGatewayComponent', () => {
  let component: FormPaymentGatewayComponent;
  let fixture: ComponentFixture<FormPaymentGatewayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPaymentGatewayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormPaymentGatewayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
