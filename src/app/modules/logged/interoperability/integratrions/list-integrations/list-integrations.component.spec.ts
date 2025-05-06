import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListIntegrationsComponent } from './list-integrations.component';

describe('ListIntegrationsComponent', () => {
  let component: ListIntegrationsComponent;
  let fixture: ComponentFixture<ListIntegrationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListIntegrationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListIntegrationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
