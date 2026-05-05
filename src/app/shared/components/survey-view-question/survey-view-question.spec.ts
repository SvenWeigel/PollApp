import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyViewQuestion } from './survey-view-question';

describe('SurveyViewQuestion', () => {
  let component: SurveyViewQuestion;
  let fixture: ComponentFixture<SurveyViewQuestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyViewQuestion],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyViewQuestion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
