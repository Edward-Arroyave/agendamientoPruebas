import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageReservesPatientComponent } from './manage-reserves-patient.component';

describe('ManageReservesPatientComponent', () => {
  let component: ManageReservesPatientComponent;
  let fixture: ComponentFixture<ManageReservesPatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageReservesPatientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageReservesPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
