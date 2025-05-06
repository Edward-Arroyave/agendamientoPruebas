import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDataUpdateComponent } from './form-data-update.component';

describe('FormDataUpdateComponent', () => {
  let component: FormDataUpdateComponent;
  let fixture: ComponentFixture<FormDataUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormDataUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDataUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
