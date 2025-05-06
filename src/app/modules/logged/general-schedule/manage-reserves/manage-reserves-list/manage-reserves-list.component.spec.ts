import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageReservesListComponent } from './manage-reserves-list.component';

describe('ManageReservesListComponent', () => {
  let component: ManageReservesListComponent;
  let fixture: ComponentFixture<ManageReservesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageReservesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageReservesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
