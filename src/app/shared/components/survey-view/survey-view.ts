import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Buttons } from "../buttons/buttons";
import { SurveyViewQuestion } from "../survey-view-question/survey-view-question";
import { SurveyViewChart } from "../survey-view-chart/survey-view-chart";
import { Supabase } from '../../../supabase';

@Component({
  selector: 'app-survey-view',
  imports: [Buttons, SurveyViewQuestion, SurveyViewChart],
  templateUrl: './survey-view.html',
  styleUrl: './survey-view.scss',
})
export class SurveyView {
  readonly dbService = inject(Supabase);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      const surveyId = Number(idParam);

      if (!idParam || Number.isNaN(surveyId)) {
        this.dbService.selectedSurvey.set(null);
        this.dbService.selectedSurveyQuestions.set([]);
        return;
      }

      this.dbService.getSurveyById(surveyId);
    });
  }

  formatDate(value: string): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('de-DE').format(new Date(value));
  }
}
