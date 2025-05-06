import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPreparationsComponent } from './form-preparations.component';

describe('FormPreparationsComponent', () => {
  let component: FormPreparationsComponent;
  let fixture: ComponentFixture<FormPreparationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPreparationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormPreparationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
