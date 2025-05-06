import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormHomologationsComponent } from './form-homologations.component';

describe('FormHomologationsComponent', () => {
  let component: FormHomologationsComponent;
  let fixture: ComponentFixture<FormHomologationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormHomologationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormHomologationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
