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
  @ViewChild('nativeDateInput', { read: ElementRef }) nativeDateInput?: ElementRef<HTMLInputElement>;

  private readonly dbService = inject(Supabase);

  questions = [0];
  endsValue = '';
  headlineError = '';
  questionErrors: Record<number, string> = {};
  answerAErrors: Record<number, string> = {};
  answerBErrors: Record<number, string> = {};

  openDatePicker(): void {
    const dateInput = this.nativeDateInput?.nativeElement;
    if (!dateInput) {
      return;
    }

    if (typeof dateInput.showPicker === 'function') {
      dateInput.showPicker();
      return;
    }

    dateInput.focus();
    dateInput.click();
  }

  onNativeDateChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const rawValue = target?.value ?? '';
    this.endsValue = rawValue ? this.formatDateForDisplay(rawValue) : '';
  }

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
    this.clearAllErrors();

    const root = this.formRoot?.nativeElement;
    if (!root) {
      this.headlineError = '*required';
      return false;
    }

    const headline = this.readInputValue(root, '.form-top--left app-input-field:first-of-type input');
    const categorySelect = root.querySelector('.form-top--left-end-date select') as HTMLSelectElement | null;
    const todayRaw = this.getTodayRawDate();
    const ends = this.endsValue || this.formatDateForDisplay(todayRaw);
    const description = this.readTextareaValue(root, '.form-top--right textarea');
    const category = categorySelect?.value?.trim() || 'other';

    if (!this.endsValue) {
      this.endsValue = ends;
      const dateInput = this.nativeDateInput?.nativeElement;
      if (dateInput) {
        dateInput.value = todayRaw;
      }
    }

    if (!headline) {
      this.headlineError = '*required';
      return false;
    }

    const firstQuestionForm = root.querySelector('app-question-form') as HTMLElement | null;
    const firstQuestionInput = firstQuestionForm?.querySelector('.form-bottom-question input') as HTMLInputElement | null;
    const firstAnswerInputs = Array.from(firstQuestionForm?.querySelectorAll('.answer-form-body app-answer-question-input input') ?? []) as HTMLInputElement[];

    const firstQuestionText = firstQuestionInput?.value.trim() ?? '';
    if (!firstQuestionText) {
      this.questionErrors[0] = '*required';
    }

    const firstAnswerA = firstAnswerInputs[0]?.value.trim() ?? '';
    const firstAnswerB = firstAnswerInputs[1]?.value.trim() ?? '';

    if (!firstAnswerA) {
      this.answerAErrors[0] = '*required';
    }

    if (!firstAnswerB) {
      this.answerBErrors[0] = '*required';
    }

    if (this.hasInlineErrors()) {
      return false;
    }

    const collectedQuestions = this.collectQuestions(root);
    if (collectedQuestions.length === 0) {
      this.questionErrors[0] = '*required';
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
      this.headlineError = error instanceof Error ? error.message : 'Speichern fehlgeschlagen.';
      return false;
    }
  }

  resetForm(): void {
    this.clearAllErrors();
    this.endsValue = '';
    this.questions = [Date.now()];

    const root = this.formRoot?.nativeElement;
    if (!root) {
      return;
    }

    const inputs = Array.from(root.querySelectorAll('input')) as HTMLInputElement[];
    for (const input of inputs) {
      if (input.type === 'checkbox') {
        input.checked = false;
        continue;
      }

      input.value = '';
    }

    const textareas = Array.from(root.querySelectorAll('textarea')) as HTMLTextAreaElement[];
    for (const textarea of textareas) {
      textarea.value = '';
    }

    const selects = Array.from(root.querySelectorAll('select')) as HTMLSelectElement[];
    for (const select of selects) {
      select.selectedIndex = 0;
    }
  }

  onFormInput(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const root = this.formRoot?.nativeElement;
    if (!root) {
      return;
    }

    const headlineInput = root.querySelector('.form-top--left app-input-field:first-of-type input') as HTMLInputElement | null;
    if (this.headlineError && target === headlineInput && headlineInput.value.trim().length > 0) {
      this.headlineError = '';
    }

    const firstQuestionForm = root.querySelector('app-question-form') as HTMLElement | null;
    const firstQuestionInput = firstQuestionForm?.querySelector('.form-bottom-question input') as HTMLInputElement | null;
    if (this.questionErrors[0] && target === firstQuestionInput && firstQuestionInput.value.trim().length > 0) {
      delete this.questionErrors[0];
    }

    const firstAnswerInputs = Array.from(firstQuestionForm?.querySelectorAll('.answer-form-body app-answer-question-input input') ?? []) as HTMLInputElement[];
    const firstAnswerA = firstAnswerInputs[0] ?? null;
    const firstAnswerB = firstAnswerInputs[1] ?? null;

    if (this.answerAErrors[0] && target === firstAnswerA && firstAnswerA.value.trim().length > 0) {
      delete this.answerAErrors[0];
    }

    if (this.answerBErrors[0] && target === firstAnswerB && firstAnswerB.value.trim().length > 0) {
      delete this.answerBErrors[0];
    }
  }

  getQuestionError(index: number): string {
    return this.questionErrors[index] ?? '';
  }

  getAnswerAError(index: number): string {
    return this.answerAErrors[index] ?? '';
  }

  getAnswerBError(index: number): string {
    return this.answerBErrors[index] ?? '';
  }

  private clearAllErrors(): void {
    this.headlineError = '';
    this.questionErrors = {};
    this.answerAErrors = {};
    this.answerBErrors = {};
  }

  private hasInlineErrors(): boolean {
    return Boolean(
      this.headlineError ||
      Object.keys(this.questionErrors).length ||
      Object.keys(this.answerAErrors).length ||
      Object.keys(this.answerBErrors).length,
    );
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

  private formatDateForDisplay(rawDate: string): string {
    const [year, month, day] = rawDate.split('-');
    if (!year || !month || !day) {
      return '';
    }

    return `${year}.${month}.${day}`;
  }

  private getTodayRawDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
