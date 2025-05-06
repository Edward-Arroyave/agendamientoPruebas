import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormIntegrationsComponent } from './form-integrations.component';

describe('FormIntegrationsComponent', () => {
  let component: FormIntegrationsComponent;
  let fixture: ComponentFixture<FormIntegrationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormIntegrationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormIntegrationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
