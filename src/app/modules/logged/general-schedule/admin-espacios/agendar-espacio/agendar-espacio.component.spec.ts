import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendarEspacioComponent } from './agendar-espacio.component';

describe('AgendarEspacioComponent', () => {
  let component: AgendarEspacioComponent;
  let fixture: ComponentFixture<AgendarEspacioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendarEspacioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgendarEspacioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
