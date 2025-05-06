import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDictionaryComponent } from './list-dictionary.component';

describe('ListDictionaryComponent', () => {
  let component: ListDictionaryComponent;
  let fixture: ComponentFixture<ListDictionaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListDictionaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListDictionaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
