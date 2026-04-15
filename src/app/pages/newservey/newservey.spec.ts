import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Newservey } from './newservey';

describe('Newservey', () => {
  let component: Newservey;
  let fixture: ComponentFixture<Newservey>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Newservey],
    }).compileComponents();

    fixture = TestBed.createComponent(Newservey);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
