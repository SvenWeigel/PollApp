import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsurveyCard } from './newsurvey-card';

describe('NewsurveyCard', () => {
  let component: NewsurveyCard;
  let fixture: ComponentFixture<NewsurveyCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsurveyCard],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsurveyCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
