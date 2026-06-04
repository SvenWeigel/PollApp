import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { InputField } from '../input-field/input-field';
import { AnswerQuestionInput } from '../answer-question-input/answer-question-input';

const ANSWER_LABELS = ['A', 'B', 'C', 'D'] as const;
type AnswerLabel = (typeof ANSWER_LABELS)[number];

@Component({
  selector: 'app-question-form',
  imports: [InputField, AnswerQuestionInput],
  templateUrl: './question-form.html',
  styleUrl: './question-form.scss',
})
export class QuestionForm {
  @Input() questionNumber: number = 1;
  @Input() questionError: string = '';
  @Input() answerAError: string = '';
  @Input() answerBError: string = '';
  @Output() deleteQuestion = new EventEmitter<void>();
  readonly answerLabels = signal<AnswerLabel[]>(['A', 'B']);

  getAnswerError(label: AnswerLabel): string {
    if (label === 'A') {
      return this.answerAError;
    }

    if (label === 'B') {
      return this.answerBError;
    }

    return '';
  }

  addAnswer(): void {
    const currentAnswers = this.answerLabels();

    if (currentAnswers.length >= ANSWER_LABELS.length) {
      return;
    }

    const nextLabel = ANSWER_LABELS[currentAnswers.length];
    this.answerLabels.update((answers) => [...answers, nextLabel]);
  }

  delete(): void {
    this.deleteQuestion.emit();
  }
}
