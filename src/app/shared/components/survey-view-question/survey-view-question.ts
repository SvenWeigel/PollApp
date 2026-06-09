import { Component, input, output } from '@angular/core';
import type { AnswerKey, VoteToggleEvent } from '../../../types/supabase.types';

@Component({
  selector: 'app-survey-view-question',
  imports: [],
  templateUrl: './survey-view-question.html',
  styleUrl: './survey-view-question.scss',
})
export class SurveyViewQuestion {
  readonly questionNumber = input<number>(1);
  readonly questionText = input<string>('');
  readonly answers = input<string[]>([]);
  readonly allowMultipleAnswers = input<boolean>(true);
  readonly isPast = input<boolean>(false);
  readonly voteToggled = output<VoteToggleEvent>();
  private selectedSingleAnswer: AnswerKey | null = null;

  /**
   * Converts an answer index into its matching letter-based answer key.
   *
   * @param index The zero-based answer index.
   * @returns The corresponding answer key.
   */
  label(index: number): AnswerKey {
    return String.fromCharCode(65 + index) as AnswerKey;
  }

  /**
    * Handles one answer toggle and delegates to multi- or single-choice flow.
   *
   * @param event The choice input change event.
   * @param index The zero-based answer index.
   */
  onChoiceChange(event: Event, index: number): void {
    const input = this.getInputFromEvent(event);
    if (!input) {
      return;
    }

    const answerKey = this.label(index);

    if (this.allowMultipleAnswers()) {
      this.emitVote(answerKey, input.checked);
      return;
    }

    if (!input.checked) {
      this.handleSingleAnswerUnchecked(answerKey);
      return;
    }

    this.handleSingleAnswerChecked(input, answerKey);
  }

  /**
    * Resolves the checkbox input from a change event target.
   *
   * @param event The change event.
   * @returns The input element when available.
   */
  private getInputFromEvent(event: Event): HTMLInputElement | null {
    return event.target as HTMLInputElement | null;
  }

  /**
    * Emits a vote toggle event for the current question.
   *
   * @param answerKey The answer key to emit.
   * @param checked Whether the answer is currently checked.
   */
  private emitVote(answerKey: AnswerKey, checked: boolean): void {
    this.voteToggled.emit({ answerKey, checked });
  }

  /**
    * Handles unchecking in single-choice mode and clears local selection state.
   *
   * @param answerKey The answer key that was unchecked.
   */
  private handleSingleAnswerUnchecked(answerKey: AnswerKey): void {
    if (this.selectedSingleAnswer === answerKey) {
      this.selectedSingleAnswer = null;
    }

    this.emitVote(answerKey, false);
  }

  /**
    * Handles checking in single-choice mode by clearing prior selection and emitting updates.
   *
   * @param input The checked input element.
   * @param answerKey The answer key that was checked.
   */
  private handleSingleAnswerChecked(input: HTMLInputElement, answerKey: AnswerKey): void {
    if (this.selectedSingleAnswer && this.selectedSingleAnswer !== answerKey) {
      this.emitVote(this.selectedSingleAnswer, false);
    }

    this.uncheckOtherOptions(input);
    this.selectedSingleAnswer = answerKey;
    this.emitVote(answerKey, true);
  }

  /**
   * Clears other checked inputs in the same question for single-choice mode.
   *
   * @param activeInput The input that has just been checked.
   */
  private uncheckOtherOptions(activeInput: HTMLInputElement): void {
    const root = activeInput.closest('main');
    if (!root) {
      return;
    }

    const checkboxes = Array.from(root.querySelectorAll('.form-check-input')) as HTMLInputElement[];
    for (const checkbox of checkboxes) {
      if (checkbox !== activeInput) {
        checkbox.checked = false;
      }
    }
  }
}
