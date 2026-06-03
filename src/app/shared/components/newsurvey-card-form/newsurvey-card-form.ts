import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { InputField } from "../input-field/input-field";
import { TextArea } from "../text-area/text-area";
import { QuestionForm } from "../question-form/question-form";
import { Buttons } from "../buttons/buttons";
import { NewQuestion, Supabase } from '../../../supabase';

@Component({
  selector: 'app-newsurvey-card-form',
  imports: [InputField, TextArea, QuestionForm, Buttons,],
  templateUrl: './newsurvey-card-form.html',
  styleUrl: './newsurvey-card-form.scss',
})
export class NewsurveyCardForm {
  @ViewChild('formRoot', { read: ElementRef }) formRoot?: ElementRef<HTMLElement>;

  private readonly dbService = inject(Supabase);

  questions = [0];
  errorMessage = '';

  addQuestion() {
    if (this.questions.length < 4) {
      this.questions.push(this.questions.length);
    }
  }

  deleteQuestion(index: number) {
    if (this.questions.length <= 1) {
      return;
    }

    this.questions.splice(index, 1);
  }

  async publishSurvey(): Promise<boolean> {
    this.errorMessage = '';

    const root = this.formRoot?.nativeElement;
    if (!root) {
      this.errorMessage = 'Form konnte nicht gelesen werden.';
      return false;
    }

    const headline = this.readInputValue(root, '.form-top--left app-input-field:first-of-type input');
    const categorySelect = root.querySelector('.form-top--left-end-date select') as HTMLSelectElement | null;
    const ends = this.readInputValue(root, '.form-top--left app-input-field:last-of-type input');
    const description = this.readTextareaValue(root, '.form-top--right textarea');
    const category = categorySelect?.value?.trim() || 'other';

    if (!headline) {
      this.errorMessage = 'Bitte gib einen Survey-Namen ein.';
      return false;
    }

    if (!ends) {
      this.errorMessage = 'Bitte gib ein Enddatum ein.';
      return false;
    }

    const collectedQuestions = this.collectQuestions(root);
    if (collectedQuestions.length === 0) {
      this.errorMessage = 'Bitte mindestens eine Frage mit 2 Antworten eingeben.';
      return false;
    }

    try {
      await this.dbService.createSurveyWithQuestions(
        {
          headline,
          description,
          ends,
          category,
        },
        collectedQuestions,
      );
      return true;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Speichern fehlgeschlagen.';
      return false;
    }
  }

  private readInputValue(root: HTMLElement, selector: string): string {
    const input = root.querySelector(selector) as HTMLInputElement | null;
    return input?.value?.trim() ?? '';
  }

  private readTextareaValue(root: HTMLElement, selector: string): string {
    const textarea = root.querySelector(selector) as HTMLTextAreaElement | null;
    return textarea?.value?.trim() ?? '';
  }

  private collectQuestions(root: HTMLElement): NewQuestion[] {
    const questionForms = Array.from(root.querySelectorAll('app-question-form'));
    const result: NewQuestion[] = [];

    for (const formEl of questionForms) {
      const questionInput = formEl.querySelector('.form-bottom-question input') as HTMLInputElement | null;
      const answerInputs = Array.from(formEl.querySelectorAll('.answer-form-body app-answer-question-input input')) as HTMLInputElement[];

      const questionText = questionInput?.value?.trim() ?? '';
      const answers = answerInputs.map((input) => input.value.trim()).filter((value) => value.length > 0);

      if (!questionText || answers.length < 2) {
        continue;
      }

      result.push({
        question: questionText,
        answerA: answers[0],
        answerB: answers[1],
        answerC: answers[2],
        answerD: answers[3],
      });
    }

    return result;
  }
}
