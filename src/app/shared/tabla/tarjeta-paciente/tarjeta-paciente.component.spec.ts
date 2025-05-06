import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetaPacienteComponent } from './tarjeta-paciente.component';

describe('TarjetaPacienteComponent', () => {
  let component: TarjetaPacienteComponent;
  let fixture: ComponentFixture<TarjetaPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaPacienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarjetaPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
