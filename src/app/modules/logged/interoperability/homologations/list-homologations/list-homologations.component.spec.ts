import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListHomologationsComponent } from './list-homologations.component';

describe('ListHomologationsComponent', () => {
  let component: ListHomologationsComponent;
  let fixture: ComponentFixture<ListHomologationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListHomologationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListHomologationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
