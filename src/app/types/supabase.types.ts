export type NewQuestion = {
  question: string;
  answerA: string;
  answerB: string;
  answerC?: string;
  answerD?: string;
  allowMultipleAnswers?: boolean;
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
  allowMultipleAnswers: boolean;
};

export type AnswerKey = 'A' | 'B' | 'C' | 'D';

export type VoteToggleEvent = {
  answerKey: AnswerKey;
  checked: boolean;
};

export type QuestionVoteCounts = Record<number, Record<AnswerKey, number>>;
