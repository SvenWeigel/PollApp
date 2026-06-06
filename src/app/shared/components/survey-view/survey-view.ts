import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Buttons } from "../buttons/buttons";
import { SurveyViewQuestion } from "../survey-view-question/survey-view-question";
import { SurveyViewChart } from "../survey-view-chart/survey-view-chart";
import { Supabase, VoteToggleEvent } from '../../../supabase';

@Component({
  selector: 'app-survey-view',
  imports: [Buttons, SurveyViewQuestion, SurveyViewChart, RouterLink],
  templateUrl: './survey-view.html',
  styleUrl: './survey-view.scss',
})
export class SurveyView {
  readonly dbService = inject(Supabase);
  private readonly route = inject(ActivatedRoute);
  readonly areResultsVisible = signal(true);

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

  async onVoteToggled(questionId: number, event: VoteToggleEvent): Promise<void> {
    const survey = this.dbService.selectedSurvey();
    if (!survey) {
      return;
    }

    if (event.checked) {
      await this.dbService.addVote(survey.id, questionId, event.answerKey);
      return;
    }

    await this.dbService.removeVote(survey.id, questionId, event.answerKey);
  }

  seeResults(): void {
    this.areResultsVisible.update((visible) => !visible);
  }
}
