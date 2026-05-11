import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyViewChart } from './survey-view-chart';

describe('SurveyViewChart', () => {
  let component: SurveyViewChart;
  let fixture: ComponentFixture<SurveyViewChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyViewChart],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyViewChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
