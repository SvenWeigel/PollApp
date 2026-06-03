import { Component, input } from '@angular/core';

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

  label(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
