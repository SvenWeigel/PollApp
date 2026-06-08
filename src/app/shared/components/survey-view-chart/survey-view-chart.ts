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

  readonly rows = computed(() => this.buildRows());

  /**
   * Builds the chart rows for the current question answers and vote counts.
   *
   * @returns The mapped answer rows including vote counts and percentages.
   */
  private buildRows() {
    const totalVotes = this.getTotalVotes();
    return this.answers().map((answerText, index) =>
      this.buildRow(answerText, this.getAnswerKey(index), totalVotes),
    );
  }

  /**
   * Calculates the total number of votes across all answer keys.
   *
   * @returns The summed vote count.
   */
  private getTotalVotes(): number {
    return this.getAnswerKeys().reduce(
      (sum, key) => sum + this.getVotesForKey(key),
      0,
    );
  }

  /**
   * Returns the supported answer keys in display order.
   *
   * @returns The ordered answer keys.
   */
  private getAnswerKeys(): AnswerKey[] {
    return ['A', 'B', 'C', 'D'];
  }

  /**
   * Resolves the answer key for a given answer index.
   *
   * @param index The answer index.
   * @returns The matching answer key.
   */
  private getAnswerKey(index: number): AnswerKey {
    return this.getAnswerKeys()[index];
  }

  /**
   * Reads the vote count for a single answer key.
   *
   * @param key The answer key to read.
   * @returns The vote count for the given key.
   */
  private getVotesForKey(key: AnswerKey): number {
    return this.counts()[key] ?? 0;
  }

  /**
   * Builds a single chart row for one answer option.
   *
   * @param answerText The answer label shown in the chart.
   * @param key The answer key assigned to the row.
   * @param totalVotes The total number of votes across all rows.
   * @returns The row data used by the template.
   */
  private buildRow(answerText: string, key: AnswerKey, totalVotes: number) {
    const votes = this.getVotesForKey(key);
    return {
      key,
      answerText,
      votes,
      percentage: this.calculatePercentage(votes, totalVotes),
    };
  }

  /**
   * Calculates the percentage share for one answer option.
   *
   * @param votes The votes of the current answer.
   * @param totalVotes The total votes across all answers.
   * @returns The rounded percentage value.
   */
  private calculatePercentage(votes: number, totalVotes: number): number {
    if (totalVotes === 0) {
      return 0;
    }

    return Math.round((votes / totalVotes) * 100);
  }
}
