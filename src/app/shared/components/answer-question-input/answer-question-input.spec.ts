import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerQuestionInput } from './answer-question-input';

describe('AnswerQuestionInput', () => {
  let component: AnswerQuestionInput;
  let fixture: ComponentFixture<AnswerQuestionInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnswerQuestionInput],
    }).compileComponents();

    fixture = TestBed.createComponent(AnswerQuestionInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
