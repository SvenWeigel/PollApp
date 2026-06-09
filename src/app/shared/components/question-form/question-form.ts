import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { InputField } from '../input-field/input-field';
import { AnswerQuestionInput } from '../answer-question-input/answer-question-input';

const ANSWER_LABELS = ['A', 'B', 'C', 'D'] as const;
type AnswerLabel = (typeof ANSWER_LABELS)[number];

export type AllowMultipleChangedEvent = {
  questionIndex: number;
  allowMultipleAnswers: boolean;
};

@Component({
  selector: 'app-question-form',
  imports: [InputField, AnswerQuestionInput],
  templateUrl: './question-form.html',
  styleUrl: './question-form.scss',
})
export class QuestionForm {
  @Input() questionIndex: number = 0;
  @Input() questionNumber: number = 1;
  @Input() questionError: string = '';
  @Input() answerAError: string = '';
  @Input() answerBError: string = '';
  @Input() allowMultipleAnswers: boolean = false;
  @Output() deleteQuestion = new EventEmitter<void>();
  @Output() allowMultipleChanged = new EventEmitter<AllowMultipleChangedEvent>();
  readonly answerLabels = signal<AnswerLabel[]>(['A', 'B']);

  /**
   * Emits the multi-answer setting for the current question.
   *
   * @param event The checkbox change event.
   */
  onAllowMultipleChanged(event: Event): void {
    const checkbox = event.target as HTMLInputElement | null;

    this.allowMultipleChanged.emit({
      questionIndex: this.questionIndex,
      allowMultipleAnswers: Boolean(checkbox?.checked),
    });
  }

  /**
   * Returns the validation message for the given answer label.
   *
   * @param label The answer label to resolve.
   * @returns The matching error message or an empty string.
   */
  getAnswerError(label: AnswerLabel): string {
    if (label === 'A') {
      return this.answerAError;
    }

    if (label === 'B') {
      return this.answerBError;
    }

    return '';
  }

  /**
   * Adds the next available answer field until the maximum number is reached.
   */
  addAnswer(): void {
    const currentAnswers = this.answerLabels();

    if (currentAnswers.length >= ANSWER_LABELS.length) {
      return;
    }

    const nextLabel = ANSWER_LABELS[currentAnswers.length];
    this.answerLabels.update((answers) => [...answers, nextLabel]);
  }

  /**
   * Emits the delete event for the current question block.
   */
  delete(): void {
    this.deleteQuestion.emit();
  }
}
