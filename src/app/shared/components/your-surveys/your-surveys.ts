import { Component, computed, inject } from '@angular/core';
import { RouterLink } from "@angular/router";
import { Supabase } from '../../../supabase';
import { Survey } from '../../interface/survey.interface';

@Component({
  selector: 'app-your-surveys',
  imports: [RouterLink,],
  templateUrl: './your-surveys.html',
  styleUrl: './your-surveys.scss',
})
export class YourSurveys {
  dbService = inject(Supabase);
  readonly surveys = computed(() => {
    return this.dbService
      .surveys()
      .filter((survey) => this.getDaysLeft(survey.ends) > 0)
      .sort((a, b) => this.getDaysLeft(a.ends) - this.getDaysLeft(b.ends))
      .slice(0, 3);
  });

  /**
   * Loads the surveys when the component is initialized.
   */
  ngOnInit(): void {
    this.dbService.getSurveys();
  }

  /**
   * Returns one survey from the computed preview list by index.
   *
   * @param index The index of the survey to access.
   * @returns The survey at the given index, if present.
   */
  getSurvey(index: number): Survey | undefined {
    return this.surveys()[index];
  }

  /**
   * Calculates the remaining number of days until the survey end date.
   *
   * @param ends The survey end date.
   * @returns The remaining number of days, never below zero.
   */
  getDaysLeft(ends: string): number {
    const today = new Date();
    const endDate = new Date(ends);
    const diffInMs = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Builds a human-readable label for the remaining survey duration.
   *
   * @param ends The survey end date.
   * @returns A singular or plural days-left label.
   */
  getDaysLeftLabel(ends: string): string {
    const daysLeft = this.getDaysLeft(ends);
    return daysLeft === 1 ? '1 day left' : `${daysLeft} days left`;
  }

  /**
   * Builds the router link for a survey preview card.
   *
   * @param index The index of the survey preview.
   * @returns The survey detail route or the home route as fallback.
   */
  getSurveyLink(index: number): (string | number)[] {
    const survey = this.getSurvey(index);
    if (!survey) {
      return ['/'];
    }

    return ['/survey', survey.id];
  }
}