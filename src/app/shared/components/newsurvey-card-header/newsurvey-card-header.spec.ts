import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsurveyCardHeader } from './newsurvey-card-header';

describe('NewsurveyCardHeader', () => {
  let component: NewsurveyCardHeader;
  let fixture: ComponentFixture<NewsurveyCardHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsurveyCardHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsurveyCardHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
