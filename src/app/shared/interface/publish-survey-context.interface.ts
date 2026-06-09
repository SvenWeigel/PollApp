import type { SurveyPayload } from './survey-payload.interface';

export interface PublishSurveyContext {
  root: HTMLElement;
  payload: SurveyPayload;
}
