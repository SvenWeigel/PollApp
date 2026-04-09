import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YourSurveys } from './your-surveys';

describe('YourSurveys', () => {
  let component: YourSurveys;
  let fixture: ComponentFixture<YourSurveys>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YourSurveys],
    }).compileComponents();

    fixture = TestBed.createComponent(YourSurveys);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
