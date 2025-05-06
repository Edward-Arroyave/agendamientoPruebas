import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDictionaryComponent } from './form-dictionary.component';

describe('FormDictionaryComponent', () => {
  let component: FormDictionaryComponent;
  let fixture: ComponentFixture<FormDictionaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormDictionaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDictionaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
