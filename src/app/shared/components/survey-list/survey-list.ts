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

  /**
   * Loads the surveys when the component is initialized.
   */
  ngOnInit(): void {
    this.dbService.getSurveys();
  }

  /**
   * Updates the selected category filter from the category dropdown.
   *
   * @param event The change event emitted by the select element.
   */
  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory.set(target.value);
  }

  /**
   * Switches the current survey status filter between active and past.
   *
   * @param status The status tab to activate.
   */
  setStatus(status: 'active' | 'past'): void {
    this.selectedStatus.set(status);
  }

  /**
   * Calculates the remaining number of days until a survey ends.
   *
   * @param ends The survey end date.
   * @returns The number of remaining days, never below zero.
   */
  private getDaysLeft(ends: string): number {
    const today = new Date();
    const endDate = new Date(ends);
    const diffInMs = endDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Checks whether a survey has already passed its end date.
   *
   * @param ends The survey end date.
   * @returns True when the survey is already expired.
   */
  private isSurveyPast(ends: string): boolean {
    const now = new Date();
    const endDate = new Date(ends);
    endDate.setHours(23, 59, 59, 999);
    return endDate.getTime() < now.getTime();
  }

  
}
