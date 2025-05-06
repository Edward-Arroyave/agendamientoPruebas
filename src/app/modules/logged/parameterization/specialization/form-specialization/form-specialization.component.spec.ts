import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSpecializationComponent } from './form-specialization.component';

describe('FormSpecializationComponent', () => {
  let component: FormSpecializationComponent;
  let fixture: ComponentFixture<FormSpecializationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormSpecializationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormSpecializationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
