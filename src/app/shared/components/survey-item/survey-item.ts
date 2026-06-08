import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Survey } from '../../interface/survey.interface';

@Component({
  selector: 'app-survey-item',
  imports: [RouterLink],
  templateUrl: './survey-item.html',
  styleUrl: './survey-item.scss',
})
export class SurveyItem {
  readonly survey = input.required<Survey>();

  /**
   * Calculates how many full days remain until the survey end date.
   *
   * @returns The number of remaining days, never below zero.
   */
  getDaysLeft(): number {
    const today = new Date();
    const endDate = new Date(this.survey().ends);
    const diffInMs = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
  }
}
