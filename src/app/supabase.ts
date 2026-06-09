import { Injectable, signal } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { Survey } from './shared/interface/survey.interface';
import type { AnswerKey, NewQuestion, NewSurvey, QuestionVoteCounts, SurveyQuestion, VoteToggleEvent } from './types/supabase.types';

export type { AnswerKey, NewQuestion, NewSurvey, SurveyQuestion, VoteToggleEvent } from './types/supabase.types';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  private votesChannel: RealtimeChannel | null = null;
  private readonly voterTokenKey = 'pollapp-voter-token';

  surveys = signal<Survey[]>([]);
  selectedSurvey = signal<Survey | null>(null);
  selectedSurveyQuestions = signal<SurveyQuestion[]>([]);
  voteCounts = signal<QuestionVoteCounts>({});

  /**
   * Loads all surveys from Supabase and stores them in local state.
   */
  async getSurveys() {
    const { data: surveys } = await this.supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false });
    if(!surveys) return;
    this.surveys.set(surveys);
  }

  /**
   * Creates a survey and persists its related questions.
   *
   * @param survey The survey payload to create.
   * @param questions The questions to attach to the survey.
   */
  async createSurveyWithQuestions(survey: NewSurvey, questions: NewQuestion[]): Promise<void> {
    const createdSurvey = await this.createSurveyRecord(survey);
    if (questions.length === 0) {
      await this.getSurveys();
      return;
    }

    await this.insertSurveyQuestions(createdSurvey.id, questions);
    await this.getSurveys();
  }

  /**
   * Loads one survey, its questions, and its vote counts by survey id.
   *
   * @param surveyId The id of the survey to load.
   */
  async getSurveyById(surveyId: number): Promise<void> {
    this.stopVoteRealtime();

    const survey = await this.fetchSurvey(surveyId);
    if (!survey) {
      this.resetSelectedSurveyState();
      return;
    }

    this.selectedSurvey.set(survey);

    const questionRows = await this.fetchSurveyQuestionRows(surveyId);
    this.selectedSurveyQuestions.set(this.mapSurveyQuestions(questionRows));
    await this.reloadVoteCounts(surveyId);
    this.startVoteRealtime(surveyId);
  }

  /**
   * Adds one vote for a survey question and refreshes the local vote counts.
   *
   * @param surveyId The survey id.
   * @param questionId The question id.
   * @param answerKey The answer key being voted for.
   */
  async addVote(surveyId: number, questionId: number, answerKey: AnswerKey): Promise<void> {
    const { error } = await this.supabase
      .from('survey_votes')
      .insert({
        survey_id: surveyId,
        question_id: questionId,
        answer_key: answerKey,
        voter_id: this.getVoterToken(),
      });

    if (error) {
      throw new Error(error.message);
    }

    await this.reloadVoteCounts(surveyId);
  }

  /**
   * Removes one vote for a survey question and refreshes the local vote counts.
   *
   * @param surveyId The survey id.
   * @param questionId The question id.
   * @param answerKey The answer key to remove.
   */
  async removeVote(surveyId: number, questionId: number, answerKey: AnswerKey): Promise<void> {
    const { error } = await this.supabase
      .from('survey_votes')
      .delete()
      .eq('survey_id', surveyId)
      .eq('question_id', questionId)
      .eq('answer_key', answerKey)
      .eq('voter_id', this.getVoterToken());

    if (error) {
      throw new Error(error.message);
    }

    await this.reloadVoteCounts(surveyId);
  }

  /**
   * Returns the current vote counts for a single question.
   *
   * @param questionId The question id.
   * @returns The counts for each answer key.
   */
  getVoteCountsForQuestion(questionId: number): Record<AnswerKey, number> {
    return this.voteCounts()[questionId] ?? { A: 0, B: 0, C: 0, D: 0 };
  }

  /**
   * Stops the active realtime vote subscription when present.
   */
  stopVoteRealtime(): void {
    if (!this.votesChannel) {
      return;
    }

    this.supabase.removeChannel(this.votesChannel);
    this.votesChannel = null;
  }

  /**
   * Creates the survey row in Supabase and returns its id.
   *
   * @param survey The survey payload to insert.
   * @returns The created survey row containing the id.
   */
  private async createSurveyRecord(survey: NewSurvey): Promise<{ id: number }> {
    const { data: createdSurvey, error } = await this.supabase
      .from('surveys')
      .insert(survey)
      .select('id')
      .single();

    if (error || !createdSurvey) {
      throw new Error(error?.message ?? 'Survey konnte nicht gespeichert werden.');
    }

    return createdSurvey;
  }

  /**
   * Inserts survey questions and falls back when some columns are unavailable.
   *
   * @param surveyId The created survey id.
   * @param questions The questions to persist.
   */
  private async insertSurveyQuestions(surveyId: number, questions: NewQuestion[]): Promise<void> {
    const preferredInsert = await this.supabase
      .from('questions')
      .insert(this.mapQuestionRows(surveyId, questions, 'question', true));

    if (!preferredInsert.error) {
      return;
    }

    const noMultiColumnInsert = await this.supabase
      .from('questions')
      .insert(this.mapQuestionRows(surveyId, questions, 'question', false));

    if (!noMultiColumnInsert.error) {
      return;
    }

    await this.insertSurveyQuestionsFallback(
      surveyId,
      questions,
      preferredInsert.error.message || noMultiColumnInsert.error.message,
    );
  }

  /**
   * Inserts questions using the fallback `questions` column name.
   *
   * @param surveyId The created survey id.
   * @param questions The questions to persist.
   * @param errorMessage The original insert error message.
   */
  private async insertSurveyQuestionsFallback(
    surveyId: number,
    questions: NewQuestion[],
    errorMessage: string,
  ): Promise<void> {
    const withMultiColumn = await this.supabase
      .from('questions')
      .insert(this.mapQuestionRows(surveyId, questions, 'questions', true));

    if (!withMultiColumn.error) {
      return;
    }

    const withoutMultiColumn = await this.supabase
      .from('questions')
      .insert(this.mapQuestionRows(surveyId, questions, 'questions', false));

    if (withoutMultiColumn.error) {
      throw new Error(
        `Questions konnten nicht gespeichert werden: ${withoutMultiColumn.error.message || withMultiColumn.error.message || errorMessage}`,
      );
    }
  }

  /**
   * Maps UI questions into database rows for the target question column.
   *
   * @param surveyId The survey id.
   * @param questions The questions to transform.
   * @param questionColumn The target question column name.
   * @param includeAllowMultipleColumn Whether to include the optional allow-multiple column.
   * @returns The mapped database rows.
   */
  private mapQuestionRows(
    surveyId: number,
    questions: NewQuestion[],
    questionColumn: 'question' | 'questions',
    includeAllowMultipleColumn: boolean,
  ): Array<Record<string, string | number | boolean | null>> {
    return questions.map((q) => {
      const row: Record<string, string | number | boolean | null> = {
        survey_id: surveyId,
        [questionColumn]: q.question,
        answer_A: q.answerA,
        answer_B: q.answerB,
        answer_C: q.answerC ?? null,
        answer_D: q.answerD ?? null,
      };

      if (includeAllowMultipleColumn) {
        row['allow_multiple_answers'] = q.allowMultipleAnswers ?? false;
      }

      return row;
    });
  }

  /**
   * Fetches one survey by id.
   *
   * @param surveyId The survey id.
   * @returns The survey row or `null` when loading fails.
   */
  private async fetchSurvey(surveyId: number): Promise<Survey | null> {
    const { data: survey, error } = await this.supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    return error || !survey ? null : survey;
  }

  /**
   * Resets the selected survey state when no survey is available.
   */
  private resetSelectedSurveyState(): void {
    this.selectedSurvey.set(null);
    this.selectedSurveyQuestions.set([]);
    this.voteCounts.set({});
  }

  /**
   * Fetches all question rows for a survey.
   *
   * @param surveyId The survey id.
   * @returns The raw question rows.
   */
  private async fetchSurveyQuestionRows(surveyId: number): Promise<Array<Record<string, unknown>>> {
    const { data: questionRows } = await this.supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('id', { ascending: true });

    return (questionRows ?? []) as Array<Record<string, unknown>>;
  }

  /**
   * Maps raw question rows into the UI question model.
   *
   * @param rows The raw database rows.
   * @returns The mapped survey questions.
   */
  private mapSurveyQuestions(rows: Array<Record<string, unknown>>): SurveyQuestion[] {
    return rows
      .map((row) => this.mapSurveyQuestion(row))
      .filter((question): question is SurveyQuestion => question !== null);
  }

  /**
   * Maps one raw question row into a survey question.
   *
   * @param row The raw database row.
   * @returns The mapped question or `null` when empty.
   */
  private mapSurveyQuestion(row: Record<string, unknown>): SurveyQuestion | null {
    const question = this.readQuestionText(row);
    if (!question.trim()) {
      return null;
    }

    return {
      id: Number(row['id']),
      question,
      answers: this.readQuestionAnswers(row),
      allowMultipleAnswers: this.readAllowMultipleAnswers(row),
    };
  }

  /**
   * Reads the multi-answer setting from a question row.
   *
   * Rows without this column are treated as multi-answer for backward compatibility.
   *
   * @param row The raw database row.
   * @returns True when multiple answers are allowed.
   */
  private readAllowMultipleAnswers(row: Record<string, unknown>): boolean {
    const value = row['allow_multiple_answers'];

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === '1' || normalized === 'true';
    }

    return true;
  }

  /**
   * Reads the question text from either supported database column.
   *
   * @param row The raw database row.
   * @returns The resolved question text.
   */
  private readQuestionText(row: Record<string, unknown>): string {
    return (row['question'] as string | null) ?? (row['questions'] as string | null) ?? '';
  }

  /**
   * Reads and trims all non-empty answers from a question row.
   *
   * @param row The raw database row.
   * @returns The filtered answer list.
   */
  private readQuestionAnswers(row: Record<string, unknown>): string[] {
    return [row['answer_A'], row['answer_B'], row['answer_C'], row['answer_D']]
      .filter((answer) => typeof answer === 'string' && answer.trim().length > 0)
      .map((answer) => (answer as string).trim());
  }

  /**
   * Starts the realtime vote subscription for a survey.
   *
   * @param surveyId The survey id to observe.
   */
  private startVoteRealtime(surveyId: number): void {
    this.votesChannel = this.supabase
      .channel(`survey-votes-${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'survey_votes',
        },
        async (payload) => this.handleVoteRealtimePayload(payload, surveyId),
      )
      .subscribe();
  }

  /**
   * Handles one realtime vote payload and refreshes counts when it belongs to the survey.
   *
   * @param payload The realtime payload from Supabase.
   * @param surveyId The active survey id.
   */
  private async handleVoteRealtimePayload(payload: unknown, surveyId: number): Promise<void> {
    if (!this.isVotePayloadForSurvey(payload, surveyId)) {
      return;
    }

    await this.reloadVoteCounts(surveyId);
  }

  /**
   * Checks whether a realtime payload belongs to the active survey.
   *
   * @param payload The realtime payload from Supabase.
   * @param surveyId The active survey id.
   * @returns True when the payload belongs to the survey.
   */
  private isVotePayloadForSurvey(payload: unknown, surveyId: number): boolean {
    const typedPayload = payload as {
      eventType?: string;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    };

    return this.matchesPayloadRecord(typedPayload.new, surveyId)
      || this.isDeletePayloadMatch(typedPayload, surveyId);
  }

  /**
   * Checks whether the delete payload record belongs to the active survey.
   *
   * @param payload The typed realtime payload.
   * @param surveyId The active survey id.
   * @returns True when the delete payload belongs to the survey.
   */
  private isDeletePayloadMatch(
    payload: { eventType?: string; old?: Record<string, unknown> },
    surveyId: number,
  ): boolean {
    return payload.eventType === 'DELETE' && this.matchesPayloadRecord(payload.old, surveyId);
  }

  /**
   * Checks whether a realtime row contains the given survey id.
   *
   * @param record The realtime row record.
   * @param surveyId The survey id to compare.
   * @returns True when the record belongs to the survey.
   */
  private matchesPayloadRecord(record: Record<string, unknown> | undefined, surveyId: number): boolean {
    if (!record || !('survey_id' in record)) {
      return false;
    }

    return Number(record['survey_id']) === surveyId;
  }

  /**
   * Reloads the aggregated vote counts for a survey.
   *
   * @param surveyId The survey id to aggregate.
   */
  private async reloadVoteCounts(surveyId: number): Promise<void> {
    const rows = await this.fetchVoteRows(surveyId);
    this.voteCounts.set(this.buildVoteCounts(rows));
  }

  /**
   * Fetches the raw vote rows for a survey.
   *
   * @param surveyId The survey id.
   * @returns The raw vote rows.
   */
  private async fetchVoteRows(surveyId: number): Promise<Array<{ question_id: unknown; answer_key: unknown }>> {
    const { data: rows } = await this.supabase
      .from('survey_votes')
      .select('question_id, answer_key')
      .eq('survey_id', surveyId);

    return (rows ?? []) as Array<{ question_id: unknown; answer_key: unknown }>;
  }

  /**
   * Builds the nested vote count map from raw vote rows.
   *
   * @param rows The raw vote rows.
   * @returns The aggregated vote counts.
   */
  private buildVoteCounts(rows: Array<{ question_id: unknown; answer_key: unknown }>): QuestionVoteCounts {
    const nextCounts: QuestionVoteCounts = {};
    for (const row of rows) {
      this.incrementVoteCount(nextCounts, row);
    }

    return nextCounts;
  }

  /**
   * Increments the vote count map for one raw vote row.
   *
   * @param counts The aggregated count map.
   * @param row The raw vote row.
   */
  private incrementVoteCount(
    counts: QuestionVoteCounts,
    row: { question_id: unknown; answer_key: unknown },
  ): void {
    const answerKey = row.answer_key as AnswerKey;
    if (!this.isAnswerKey(answerKey)) {
      return;
    }

    const questionId = Number(row.question_id);
    counts[questionId] ??= this.emptyCounts();
    counts[questionId][answerKey] += 1;
  }

  /**
   * Checks whether a string is a supported answer key.
   *
   * @param value The value to validate.
   * @returns True when the value is `A`, `B`, `C`, or `D`.
   */
  private isAnswerKey(value: string): value is AnswerKey {
    return value === 'A' || value === 'B' || value === 'C' || value === 'D';
  }

  /**
   * Creates an empty vote count object for one question.
   *
   * @returns The initialized answer key counts.
   */
  private emptyCounts(): Record<AnswerKey, number> {
    return { A: 0, B: 0, C: 0, D: 0 };
  }

  /**
   * Returns the persistent voter token for the current client.
   *
   * @returns The server token or the browser-local voter token.
   */
  private getVoterToken(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }

    const existingToken = window.localStorage.getItem(this.voterTokenKey);
    if (existingToken) {
      return existingToken;
    }

    const generatedToken = crypto.randomUUID();
    window.localStorage.setItem(this.voterTokenKey, generatedToken);
    return generatedToken;
  }
}
