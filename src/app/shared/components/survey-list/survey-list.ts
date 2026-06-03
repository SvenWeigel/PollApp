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

    if (category === 'all') {
      return surveys;
    }

    return surveys.filter((survey) => survey.category.toLowerCase() === category);
  });

  ngOnInit(): void {
    this.dbService.getSurveys();
  }

  onCategoryChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategory.set(target.value);
  }
}
