import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Newsurvey } from './newsurvey';

describe('Newsurvey', () => {
  let component: Newsurvey;
  let fixture: ComponentFixture<Newsurvey>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Newsurvey],
    }).compileComponents();

    fixture = TestBed.createComponent(Newsurvey);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
