import { Component, input, output } from '@angular/core';
import { AnswerKey, VoteToggleEvent } from '../../../supabase';

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
  readonly isPast = input<boolean>(false);
  readonly voteToggled = output<VoteToggleEvent>();

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
   * Emits the vote toggle event when a checkbox state changes.
   *
   * @param event The checkbox change event.
   * @param index The zero-based answer index.
   */
  onCheckboxChange(event: Event, index: number): void {
    const checkbox = event.target as HTMLInputElement;

    this.voteToggled.emit({
      answerKey: this.label(index),
      checked: checkbox.checked,
    });
  }
}
