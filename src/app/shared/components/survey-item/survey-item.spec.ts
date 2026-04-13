import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyItem } from './survey-item';

describe('SurveyItem', () => {
  let component: SurveyItem;
  let fixture: ComponentFixture<SurveyItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveyItem],
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
