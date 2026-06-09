import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Buttons } from "../buttons/buttons";
import { SurveyViewQuestion } from "../survey-view-question/survey-view-question";
import { SurveyViewChart } from "../survey-view-chart/survey-view-chart";
import { Supabase } from '../../../supabase';
import type { AnswerKey, VoteToggleEvent } from '../../../types/supabase.types';

@Component({
  selector: 'app-survey-view',
  imports: [Buttons, SurveyViewQuestion, SurveyViewChart, RouterLink],
  templateUrl: './survey-view.html',
  styleUrl: './survey-view.scss',
})
export class SurveyView {
  readonly dbService = inject(Supabase);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly areResultsVisible = signal(true);
  readonly isSavingVotes = signal(false);
  readonly voteSaveError = signal('');
  private pendingVotesByQuestion: Record<number, Set<AnswerKey>> = {};

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
        this.pendingVotesByQuestion = {};
        this.voteSaveError.set('');
        return;
      }
      this.pendingVotesByQuestion = {};
      this.voteSaveError.set('');
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
  onVoteToggled(questionId: number, event: VoteToggleEvent): void {
    const survey = this.dbService.selectedSurvey();
    if (!survey) {
      return;
    }
    if (this.isPastSurvey(survey.ends)) {
      return;
    }
    const stagedVotes = this.pendingVotesByQuestion[questionId] ?? new Set<AnswerKey>();
    if (event.checked) {
      stagedVotes.add(event.answerKey);
    } else {
      stagedVotes.delete(event.answerKey);
    }
    this.pendingVotesByQuestion[questionId] = stagedVotes;
    this.voteSaveError.set('');
  }

  /**
   * Completes the survey flow by persisting staged votes and navigating away.
   */
  async completeSurvey(): Promise<void> {
    const survey = this.getCompletableSurvey();
    if (!survey) {
      return;
    }

    const stagedVotes = this.getStagedVotes();
    if (stagedVotes.length === 0) {
      await this.navigateToLanding();
      return;
    }

    await this.persistStagedVotesAndNavigate(survey.id, stagedVotes);
  }

  /**
   * Returns the current survey when voting can be completed.
   *
   * @returns The selected survey or `null` when completion is blocked.
   */
  private getCompletableSurvey(): { id: number } | null {
    const survey = this.dbService.selectedSurvey();
    if (!survey || this.isSavingVotes()) {
      return null;
    }

    return survey;
  }

  /**
   * Returns staged votes as entry tuples grouped by question id.
   *
   * @returns The staged vote entries.
   */
  private getStagedVotes(): Array<[string, Set<AnswerKey>]> {
    return Object.entries(this.pendingVotesByQuestion);
  }

  /**
   * Persists staged votes, clears local state, and navigates to landing on success.
   *
   * @param surveyId The active survey id.
   * @param stagedVotes The staged vote entries to persist.
   */
  private async persistStagedVotesAndNavigate(
    surveyId: number,
    stagedVotes: Array<[string, Set<AnswerKey>]>,
  ): Promise<void> {
    this.startVoteSave();

    try {
      await this.saveStagedVotes(surveyId, stagedVotes);
      this.pendingVotesByQuestion = {};
      await this.navigateToLanding();
    } catch (error) {
      this.setVoteSaveError(error);
    } finally {
      this.endVoteSave();
    }
  }

  /**
   * Persists staged vote entries for all question groups.
   *
   * @param surveyId The active survey id.
   * @param stagedVotes The staged vote entries to persist.
   */
  private async saveStagedVotes(
    surveyId: number,
    stagedVotes: Array<[string, Set<AnswerKey>]>,
  ): Promise<void> {
    for (const [rawQuestionId, stagedAnswerKeys] of stagedVotes) {
      const questionId = Number(rawQuestionId);

      for (const answerKey of stagedAnswerKeys) {
        await this.dbService.addVote(surveyId, questionId, answerKey);
      }
    }
  }

  /**
   * Initializes save state before vote persistence.
   */
  private startVoteSave(): void {
    this.isSavingVotes.set(true);
    this.voteSaveError.set('');
  }

  /**
   * Resets save state after vote persistence finishes.
   */
  private endVoteSave(): void {
    this.isSavingVotes.set(false);
  }

  /**
   * Stores a human-readable vote save error message.
   *
   * @param error The thrown error value.
   */
  private setVoteSaveError(error: unknown): void {
    this.voteSaveError.set(error instanceof Error ? error.message : 'Votes konnten nicht gespeichert werden.');
  }

  /**
   * Navigates to the landing page.
   */
  private async navigateToLanding(): Promise<void> {
    await this.router.navigate(['/']);
  }

  /**
   * Returns live chart counts by combining persisted votes with unsaved local choices.
   *
   * @param questionId The question id.
   * @returns The merged answer counts shown in the chart.
   */
  getLiveCountsForQuestion(questionId: number): Record<AnswerKey, number> {
    const persistedCounts = this.dbService.getVoteCountsForQuestion(questionId);
    const stagedVotes = this.pendingVotesByQuestion[questionId];

    if (!stagedVotes || stagedVotes.size === 0) {
      return persistedCounts;
    }

    return {
      A: persistedCounts.A + Number(stagedVotes.has('A')),
      B: persistedCounts.B + Number(stagedVotes.has('B')),
      C: persistedCounts.C + Number(stagedVotes.has('C')),
      D: persistedCounts.D + Number(stagedVotes.has('D')),
    };
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
