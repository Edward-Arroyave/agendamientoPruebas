import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormExamsComponent } from './form-exams.component';

describe('FormExamsComponent', () => {
  let component: FormExamsComponent;
  let fixture: ComponentFixture<FormExamsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormExamsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormExamsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
