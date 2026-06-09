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
   * Emits vote toggle events and enforces single-choice mode when configured.
   *
   * @param event The choice input change event.
   * @param index The zero-based answer index.
   */
  onChoiceChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }

    const answerKey = this.label(index);

    if (this.allowMultipleAnswers()) {
      this.voteToggled.emit({
        answerKey,
        checked: input.checked,
      });
      return;
    }

    if (!input.checked) {
      if (this.selectedSingleAnswer === answerKey) {
        this.selectedSingleAnswer = null;
      }

      this.voteToggled.emit({
        answerKey,
        checked: false,
      });
      return;
    }

    if (this.selectedSingleAnswer && this.selectedSingleAnswer !== answerKey) {
      this.voteToggled.emit({
        answerKey: this.selectedSingleAnswer,
        checked: false,
      });
    }

    this.uncheckOtherOptions(input);

    this.selectedSingleAnswer = answerKey;

    this.voteToggled.emit({
      answerKey,
      checked: true,
    });
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
