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

  ngOnInit(): void {
    this.dbService.getSurveys();
  }

  getSurvey(index: number): Survey | undefined {
    return this.surveys()[index];
  }

  getDaysLeft(ends: string): number {
    const today = new Date();
    const endDate = new Date(ends);
    const diffInMs = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
  }

  getDaysLeftLabel(ends: string): string {
    const daysLeft = this.getDaysLeft(ends);
    return daysLeft === 1 ? '1 day left' : `${daysLeft} days left`;
  }

  getSurveyLink(index: number): (string | number)[] {
    const survey = this.getSurvey(index);
    if (!survey) {
      return ['/'];
    }

    return ['/survey', survey.id];
  }
}