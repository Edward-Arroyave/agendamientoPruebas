import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFeaturesComponent } from './form-features.component';

describe('FormFeaturesComponent', () => {
  let component: FormFeaturesComponent;
  let fixture: ComponentFixture<FormFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFeaturesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
