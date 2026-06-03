import { Injectable, signal, } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
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

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

  surveys = signal<Survey[]>([]);
  selectedSurvey = signal<Survey | null>(null);
  selectedSurveyQuestions = signal<SurveyQuestion[]>([]);

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
    const { data: survey, error: surveyError } = await this.supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (surveyError || !survey) {
      this.selectedSurvey.set(null);
      this.selectedSurveyQuestions.set([]);
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
  }
}
