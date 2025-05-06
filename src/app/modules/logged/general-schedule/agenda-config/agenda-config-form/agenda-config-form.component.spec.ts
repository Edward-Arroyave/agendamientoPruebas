import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendaConfigFormComponent } from './agenda-config-form.component';

describe('AgendaConfigFormComponent', () => {
  let component: AgendaConfigFormComponent;
  let fixture: ComponentFixture<AgendaConfigFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaConfigFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgendaConfigFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
