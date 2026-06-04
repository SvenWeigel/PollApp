import { Injectable, signal } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { Survey } from './shared/interface/survey.interface';

export type NewQuestion = {
  question: string;
  answerA: string;
  answerB: string;
  answerC?: string;
  answerD?: string;
};

export type NewSurvey = {
  headline: string;
  description: string;
  ends: string;
  category: string;
};

export type SurveyQuestion = {
  id: number;
  question: string;
  answers: string[];
};

export type AnswerKey = 'A' | 'B' | 'C' | 'D';

export type VoteToggleEvent = {
  answerKey: AnswerKey;
  checked: boolean;
};

type QuestionVoteCounts = Record<number, Record<AnswerKey, number>>;

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

  async getSurveys() {
    const { data: surveys } = await this.supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false });
    if(!surveys) return;
    this.surveys.set(surveys);
  }

  async createSurveyWithQuestions(survey: NewSurvey, questions: NewQuestion[]): Promise<void> {
    const { data: createdSurvey, error: surveyError } = await this.supabase
      .from('surveys')
      .insert(survey)
      .select('id')
      .single();

    if (surveyError || !createdSurvey) {
      throw new Error(surveyError?.message ?? 'Survey konnte nicht gespeichert werden.');
    }

    if (questions.length === 0) {
      await this.getSurveys();
      return;
    }

    const rowsWithQuestion = questions.map((q) => ({
      survey_id: createdSurvey.id,
      question: q.question,
      answer_A: q.answerA,
      answer_B: q.answerB,
      answer_C: q.answerC ?? null,
      answer_D: q.answerD ?? null,
    }));

    const { error: questionError } = await this.supabase
      .from('questions')
      .insert(rowsWithQuestion);

    if (questionError) {
      const rowsWithQuestions = questions.map((q) => ({
        survey_id: createdSurvey.id,
        questions: q.question,
        answer_A: q.answerA,
        answer_B: q.answerB,
        answer_C: q.answerC ?? null,
        answer_D: q.answerD ?? null,
      }));

      const { error: fallbackError } = await this.supabase
        .from('questions')
        .insert(rowsWithQuestions);

      if (fallbackError) {
        throw new Error(`Questions konnten nicht gespeichert werden: ${fallbackError.message}`);
      }
    }

    await this.getSurveys();
  }

  async getSurveyById(surveyId: number): Promise<void> {
    this.stopVoteRealtime();

    const { data: survey, error: surveyError } = await this.supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (surveyError || !survey) {
      this.selectedSurvey.set(null);
      this.selectedSurveyQuestions.set([]);
      this.voteCounts.set({});
      return;
    }

    this.selectedSurvey.set(survey);

    const { data: questionRows } = await this.supabase
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('id', { ascending: true });

    const mappedQuestions = (questionRows ?? []).map((row) => ({
      id: row.id as number,
      question: (row.question as string | null) ?? (row.questions as string | null) ?? '',
      answers: [row.answer_A, row.answer_B, row.answer_C, row.answer_D]
        .filter((answer) => typeof answer === 'string' && answer.trim().length > 0)
        .map((answer) => (answer as string).trim()),
    })).filter((q) => q.question.trim().length > 0);

    this.selectedSurveyQuestions.set(mappedQuestions);
    await this.reloadVoteCounts(surveyId);
    this.startVoteRealtime(surveyId);
  }

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

  getVoteCountsForQuestion(questionId: number): Record<AnswerKey, number> {
    return this.voteCounts()[questionId] ?? { A: 0, B: 0, C: 0, D: 0 };
  }

  stopVoteRealtime(): void {
    if (!this.votesChannel) {
      return;
    }

    this.supabase.removeChannel(this.votesChannel);
    this.votesChannel = null;
  }

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
        async (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'survey_id' in payload.new) {
            const payloadSurveyId = Number((payload.new as { survey_id: number }).survey_id);
            if (payloadSurveyId !== surveyId) {
              return;
            }
          }

          if (payload.eventType === 'DELETE' && payload.old && typeof payload.old === 'object' && 'survey_id' in payload.old) {
            const payloadSurveyId = Number((payload.old as { survey_id: number }).survey_id);
            if (payloadSurveyId !== surveyId) {
              return;
            }
          }

          await this.reloadVoteCounts(surveyId);
        },
      )
      .subscribe();
  }

  private async reloadVoteCounts(surveyId: number): Promise<void> {
    const { data: rows } = await this.supabase
      .from('survey_votes')
      .select('question_id, answer_key')
      .eq('survey_id', surveyId);

    const nextCounts: QuestionVoteCounts = {};

    for (const row of rows ?? []) {
      const questionId = Number(row.question_id);
      const answerKey = row.answer_key as AnswerKey;

      if (!this.isAnswerKey(answerKey)) {
        continue;
      }

      if (!nextCounts[questionId]) {
        nextCounts[questionId] = this.emptyCounts();
      }

      nextCounts[questionId][answerKey] += 1;
    }

    this.voteCounts.set(nextCounts);
  }

  private isAnswerKey(value: string): value is AnswerKey {
    return value === 'A' || value === 'B' || value === 'C' || value === 'D';
  }

  private emptyCounts(): Record<AnswerKey, number> {
    return { A: 0, B: 0, C: 0, D: 0 };
  }

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
