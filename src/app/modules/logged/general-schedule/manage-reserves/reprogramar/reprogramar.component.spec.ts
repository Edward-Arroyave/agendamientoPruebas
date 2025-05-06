import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReprogramarComponent } from './reprogramar.component';

describe('ReprogramarComponent', () => {
  let component: ReprogramarComponent;
  let fixture: ComponentFixture<ReprogramarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReprogramarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReprogramarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
