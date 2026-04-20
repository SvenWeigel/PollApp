import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsurveyCardForm } from './newsurvey-card-form';

describe('NewsurveyCardForm', () => {
  let component: NewsurveyCardForm;
  let fixture: ComponentFixture<NewsurveyCardForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsurveyCardForm],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsurveyCardForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
