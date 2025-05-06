import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendaConfigListComponent } from './agenda-config-list.component';

describe('AgendaConfigListComponent', () => {
  let component: AgendaConfigListComponent;
  let fixture: ComponentFixture<AgendaConfigListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaConfigListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgendaConfigListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
