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
  readonly selectedStatus = signal<'active' | 'past'>('active');
  readonly filteredSurveys = computed(() => {
    const category = this.selectedCategory().toLowerCase();
    const surveys = this.dbService.surveys();

    const surveysByStatus = surveys.filter((survey) => {
      const isPast = this.isSurveyPast(survey.ends);
      return this.selectedStatus() === 'past' ? isPast : !isPast;
    });

    const sortedByDaysLeft = [...surveysByStatus].sort(
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

  setStatus(status: 'active' | 'past'): void {
    this.selectedStatus.set(status);
  }

  private getDaysLeft(ends: string): number {
    const today = new Date();
    const endDate = new Date(ends);
    const diffInMs = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
  }

  private isSurveyPast(ends: string): boolean {
    const now = new Date();
    const endDate = new Date(ends);
    endDate.setHours(23, 59, 59, 999);
    return endDate.getTime() < now.getTime();
  }

  
}
