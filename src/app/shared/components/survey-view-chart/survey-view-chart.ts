import { Component, computed, input } from '@angular/core';
import { AnswerKey } from '../../../supabase';

@Component({
  selector: 'app-survey-view-chart',
  imports: [],
  templateUrl: './survey-view-chart.html',
  styleUrl: './survey-view-chart.scss',
})
export class SurveyViewChart {
  readonly questionNumber = input<number>(1);
  readonly questionText = input<string>('');
  readonly answers = input<string[]>([]);
  readonly counts = input<Record<AnswerKey, number>>({ A: 0, B: 0, C: 0, D: 0 });

  readonly rows = computed(() => {
    const keys: AnswerKey[] = ['A', 'B', 'C', 'D'];
    const totalVotes = keys.reduce((sum, key) => sum + (this.counts()[key] ?? 0), 0);

    return this.answers().map((answerText, index) => {
      const key = keys[index];
      const votes = this.counts()[key] ?? 0;
      const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

      return {
        key,
        answerText,
        votes,
        percentage,
      };
    });
  });
}
