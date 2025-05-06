import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricalScheduleComponent } from './historical-schedule.component';

describe('HistoricalScheduleComponent', () => {
  let component: HistoricalScheduleComponent;
  let fixture: ComponentFixture<HistoricalScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricalScheduleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricalScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
