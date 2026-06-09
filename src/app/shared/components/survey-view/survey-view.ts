import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Buttons } from "../buttons/buttons";
import { SurveyViewQuestion } from "../survey-view-question/survey-view-question";
import { SurveyViewChart } from "../survey-view-chart/survey-view-chart";
import { Supabase } from '../../../supabase';
import type { VoteToggleEvent } from '../../../types/supabase.types';

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

  /**
   * Loads the survey and its questions based on the current route parameter.
   */
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

  /**
   * Formats a date string for display in German locale.
   *
   * @param value The raw date value.
   * @returns The formatted date or `-` when no value is present.
   */
  formatDate(value: string): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('de-DE').format(new Date(value));
  }

  /**
   * Adds or removes a vote for a question unless the survey has already expired.
   *
   * @param questionId The question being voted on.
   * @param event The toggle payload describing the answer key and checked state.
   */
  async onVoteToggled(questionId: number, event: VoteToggleEvent): Promise<void> {
    const survey = this.dbService.selectedSurvey();
    if (!survey) {
      return;
    }

    if (this.isPastSurvey(survey.ends)) {
      return;
    }

    if (event.checked) {
      await this.dbService.addVote(survey.id, questionId, event.answerKey);
      return;
    }

    await this.dbService.removeVote(survey.id, questionId, event.answerKey);
  }

  /**
   * Toggles the visibility of the results panel.
   */
  seeResults(): void {
    this.areResultsVisible.update((visible) => !visible);
  }

  /**
   * Checks whether a survey is already past its end date.
   *
   * @param ends The survey end date.
   * @returns True when the survey is expired.
   */
  isPastSurvey(ends: string): boolean {
    const now = new Date();
    const endDate = new Date(ends);
    endDate.setHours(23, 59, 59, 999);
    return endDate.getTime() < now.getTime();
  }
}
