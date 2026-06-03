import { Component, computed, inject, signal } from '@angular/core';
import { SurveyItem } from "../survey-item/survey-item";
import { Supabase } from '../../../supabase';

@Component({
  selector: 'app-survey-list',
  imports: [SurveyItem],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList {
  readonly dbService = inject(Supabase);
  readonly selectedCategory = signal('All');
  readonly filteredSurveys = computed(() => {
    const category = this.selectedCategory().toLowerCase();
    const surveys = this.dbService.surveys();

    const sortedByDaysLeft = [...surveys].sort(
      (a, b) => this.getDaysLeft(a.ends) - this.getDaysLeft(b.ends),
    );

    if (category === 'all') {
      return sortedByDaysLeft;
    }

    return sortedByDaysLeft.filter((survey) => survey.category.toLowerCase() === category);
  });

  ngOnInit(): void {
    this.dbService.getSurveys();
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory.set(target.value);
  }

  private getDaysLeft(ends: string): number {
    const today = new Date();
    const endDate = new Date(ends);
    const diffInMs = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
  }
}
