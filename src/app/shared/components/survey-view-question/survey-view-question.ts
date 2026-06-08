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

  label(index: number): AnswerKey {
    return String.fromCharCode(65 + index) as AnswerKey;
  }

  onCheckboxChange(event: Event, index: number): void {
    const checkbox = event.target as HTMLInputElement;

    this.voteToggled.emit({
      answerKey: this.label(index),
      checked: checkbox.checked,
    });
  }
}
