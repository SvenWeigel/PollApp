import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { InputField } from "../input-field/input-field";
import { TextArea } from "../text-area/text-area";
import { QuestionForm } from "../question-form/question-form";
import { Buttons } from "../buttons/buttons";
import { NewQuestion, Supabase } from '../../../supabase';
import type { AllowMultipleChangedEvent } from '../question-form/question-form';

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
  allowMultipleAnswersByQuestion: Record<number, boolean> = {};

  /**
   * Returns the minimum selectable raw date for the native date input.
   *
   * Prevents selecting calendar days that lie in the past.
   */
  get minSelectableDate(): string {
    return this.getTodayRawDate();
  }

  /**
   * Opens the native date picker when available and falls back to focusing the input.
   */
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

  /**
   * Updates the displayed end date after the native date input changes.
   *
   * Any past date value is normalized to today's date.
   *
   * @param event The change event emitted by the date input.
   */
  onNativeDateChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const rawValue = target?.value ?? '';
    const normalizedValue = this.clampDateToMinSelectable(rawValue);

    if (target && normalizedValue !== rawValue) {
      target.value = normalizedValue;
    }

    this.endsValue = normalizedValue ? this.formatDateForDisplay(normalizedValue) : '';
  }

  /**
   * Adds another question block until the maximum number of questions is reached.
   */
  addQuestion() {
    if (this.questions.length < 4) {
      this.questions.push(this.questions.length);
    }
  }

  /**
   * Removes a question block when more than one question remains.
   *
   * @param index The index of the question to remove.
   */
  deleteQuestion(index: number) {
    if (this.questions.length <= 1) {
      return;
    }

    this.questions.splice(index, 1);
    this.reindexAllowMultipleSettingsAfterDelete(index);
  }

  /**
   * Stores the current multi-answer setting for one question.
   *
   * @param event The changed setting and its question index.
   */
  onAllowMultipleChanged(event: AllowMultipleChangedEvent): void {
    this.allowMultipleAnswersByQuestion[event.questionIndex] = event.allowMultipleAnswers;
  }

  /**
   * Validates the form, builds the survey payload, and saves it to Supabase.
   *
   * @returns True when the survey was saved successfully.
   */
  async publishSurvey(): Promise<boolean> {
    this.clearAllErrors();

    const root = this.getFormRootOrFail();
    if (!root) {
      return false;
    }

    const payload = this.buildSurveyPayload(root);
    if (!this.validateHeadline(payload.headline)) {
      return false;
    }

    this.validateRequiredFirstQuestionFields(root);

    if (this.hasInlineErrors()) {
      return false;
    }

    const collectedQuestions = this.collectQuestions(root);
    if (!this.ensureQuestionsCollected(collectedQuestions)) {
      return false;
    }

    return this.saveSurvey(payload, collectedQuestions);
  }

  /**
   * Clears the full survey form and restores its initial UI state.
   */
  resetForm(): void {
    this.clearAllErrors();
    this.endsValue = '';
    this.questions = [Date.now()];
    this.allowMultipleAnswersByQuestion = {};

    const root = this.formRoot?.nativeElement;
    if (!root) {
      return;
    }

    this.resetAllInputs(root);
    this.resetAllTextareas(root);
    this.resetAllSelects(root);
  }

  /**
   * Clears inline validation errors while the user edits the form.
   *
   * @param event The input event raised from the form root.
   */
  onFormInput(event: Event): void {
    const target = event.target as HTMLElement | null;
    const root = this.formRoot?.nativeElement;
    if (!target || !root) {
      return;
    }

    this.clearHeadlineErrorOnInput(root, target);
    this.clearFirstQuestionErrorsOnInput(root, target);
  }

  /**
   * Returns the validation message for a question input.
   *
   * @param index The question index.
   * @returns The current error message or an empty string.
   */
  getQuestionError(index: number): string {
    return this.questionErrors[index] ?? '';
  }

  /**
   * Returns the validation message for answer A of a question.
   *
   * @param index The question index.
   * @returns The current error message or an empty string.
   */
  getAnswerAError(index: number): string {
    return this.answerAErrors[index] ?? '';
  }

  /**
   * Returns the validation message for answer B of a question.
   *
   * @param index The question index.
   * @returns The current error message or an empty string.
   */
  getAnswerBError(index: number): string {
    return this.answerBErrors[index] ?? '';
  }

  /**
   * Returns the form root element or sets a generic error when it is missing.
   *
   * @returns The form root element when available.
   */
  private getFormRootOrFail(): HTMLElement | null {
    const root = this.formRoot?.nativeElement;
    if (!root) {
      this.headlineError = '*required';
      return null;
    }

    return root;
  }

  /**
   * Collects the survey payload values from the form root.
   *
   * @param root The form root element.
   * @returns The payload object used for survey creation.
   */
  private buildSurveyPayload(root: HTMLElement): {
    headline: string;
    description: string;
    ends: string;
    category: string;
  } {
    const headline = this.readInputValue(root, '.form-top--left app-input-field:first-of-type input');
    const description = this.readTextareaValue(root, '.form-top--right textarea');
    const category = this.readCategory(root);
    const ends = this.resolveEndsAndSyncDateInput();
    return { headline, description, ends, category };
  }

  /**
   * Reads the selected survey category from the form.
   *
   * @param root The form root element.
   * @returns The selected category or `other` as fallback.
   */
  private readCategory(root: HTMLElement): string {
    const selector = '.form-top--left-end-date select';
    const select = root.querySelector(selector) as HTMLSelectElement | null;
    return select?.value?.trim() || 'other';
  }

  /**
   * Resolves the end date and fills in today's date when none was selected.
   *
   * @returns The formatted end date string.
   */
  private resolveEndsAndSyncDateInput(): string {
    const todayRaw = this.getTodayRawDate();
    const ends = this.endsValue || this.formatDateForDisplay(todayRaw);
    this.syncDefaultDateIfMissing(ends, todayRaw);
    return ends;
  }

  /**
   * Writes a default date into component state and the native date input when missing.
   *
   * @param ends The formatted date shown in the UI.
   * @param todayRaw The raw ISO-like date for the native input.
   */
  private syncDefaultDateIfMissing(ends: string, todayRaw: string): void {
    if (this.endsValue) {
      return;
    }

    this.endsValue = ends;
    const dateInput = this.nativeDateInput?.nativeElement;
    if (dateInput) {
      dateInput.value = todayRaw;
    }
  }

  /**
   * Validates that the survey headline is present.
   *
   * @param headline The current headline value.
   * @returns True when the headline is valid.
   */
  private validateHeadline(headline: string): boolean {
    if (headline) {
      return true;
    }

    this.headlineError = '*required';
    return false;
  }

  /**
   * Validates the required fields of the first question block.
   *
   * @param root The form root element.
   */
  private validateRequiredFirstQuestionFields(root: HTMLElement): void {
    const form = root.querySelector('app-question-form') as HTMLElement | null;
    const questionInput = form?.querySelector('.form-bottom-question input') as HTMLInputElement | null;
    const answerInputs = Array.from(form?.querySelectorAll('.answer-form-body app-answer-question-input input') ?? []) as HTMLInputElement[];
    this.setRequiredQuestionError(questionInput?.value.trim() ?? '');
    this.setRequiredAnswerErrors(answerInputs);
  }

  /**
   * Sets the first-question error when the question text is empty.
   *
   * @param questionText The current text of the first question.
   */
  private setRequiredQuestionError(questionText: string): void {
    if (!questionText) {
      this.questionErrors[0] = '*required';
    }
  }

  /**
   * Sets required errors for the first two answer inputs.
   *
   * @param answerInputs The answer input elements of the first question.
   */
  private setRequiredAnswerErrors(answerInputs: HTMLInputElement[]): void {
    const answerA = answerInputs[0]?.value.trim() ?? '';
    const answerB = answerInputs[1]?.value.trim() ?? '';

    if (!answerA) {
      this.answerAErrors[0] = '*required';
    }

    if (!answerB) {
      this.answerBErrors[0] = '*required';
    }
  }

  /**
   * Ensures that at least one valid question was collected from the form.
   *
   * @param collectedQuestions The mapped questions from the current form.
   * @returns True when at least one valid question exists.
   */
  private ensureQuestionsCollected(collectedQuestions: NewQuestion[]): boolean {
    if (collectedQuestions.length > 0) {
      return true;
    }

    this.questionErrors[0] = '*required';
    return false;
  }

  /**
   * Persists the survey and its questions via the Supabase service.
   *
   * @param payload The survey payload to save.
   * @param collectedQuestions The validated questions to store.
   * @returns True when saving succeeds.
   */
  private async saveSurvey(
    payload: { headline: string; description: string; ends: string; category: string },
    collectedQuestions: NewQuestion[],
  ): Promise<boolean> {
    try {
      await this.dbService.createSurveyWithQuestions(payload, collectedQuestions);
      return true;
    } catch (error) {
      this.headlineError = error instanceof Error ? error.message : 'Speichern fehlgeschlagen.';
      return false;
    }
  }

  /**
   * Clears all input elements within the form root.
   *
   * @param root The form root element.
   */
  private resetAllInputs(root: HTMLElement): void {
    const inputs = Array.from(root.querySelectorAll('input')) as HTMLInputElement[];
    for (const input of inputs) {
      if (input.type === 'checkbox') {
        input.checked = false;
        continue;
      }

      input.value = '';
    }
  }

  /**
   * Clears all textarea elements within the form root.
   *
   * @param root The form root element.
   */
  private resetAllTextareas(root: HTMLElement): void {
    const textareas = Array.from(root.querySelectorAll('textarea')) as HTMLTextAreaElement[];
    for (const textarea of textareas) {
      textarea.value = '';
    }
  }

  /**
   * Resets all select elements to their first option.
   *
   * @param root The form root element.
   */
  private resetAllSelects(root: HTMLElement): void {
    const selects = Array.from(root.querySelectorAll('select')) as HTMLSelectElement[];
    for (const select of selects) {
      select.selectedIndex = 0;
    }
  }

  /**
   * Removes the headline error once the headline input contains text.
   *
   * @param root The form root element.
   * @param target The element that triggered the input event.
   */
  private clearHeadlineErrorOnInput(root: HTMLElement, target: HTMLElement): void {
    const selector = '.form-top--left app-input-field:first-of-type input';
    const headlineInput = root.querySelector(selector) as HTMLInputElement | null;
    const hasText = Boolean(headlineInput?.value.trim().length);

    if (this.headlineError && target === headlineInput && hasText) {
      this.headlineError = '';
    }
  }

  /**
   * Removes first-question validation errors when the related inputs become valid.
   *
   * @param root The form root element.
   * @param target The element that triggered the input event.
   */
  private clearFirstQuestionErrorsOnInput(root: HTMLElement, target: HTMLElement): void {
    const form = root.querySelector('app-question-form') as HTMLElement | null;
    const questionInput = form?.querySelector('.form-bottom-question input') as HTMLInputElement | null;
    const answerInputs = Array.from(form?.querySelectorAll('.answer-form-body app-answer-question-input input') ?? []) as HTMLInputElement[];
    this.clearQuestionErrorOnInput(questionInput, target);
    this.clearAnswerErrorsOnInput(answerInputs, target);
  }

  /**
   * Removes the first-question text error after the user enters content.
   *
   * @param input The first question input element.
   * @param target The element that triggered the input event.
   */
  private clearQuestionErrorOnInput(input: HTMLInputElement | null, target: HTMLElement): void {
    const hasText = Boolean(input?.value.trim().length);
    if (this.questionErrors[0] && target === input && hasText) {
      delete this.questionErrors[0];
    }
  }

  /**
   * Removes required errors from the first two answer inputs when text is entered.
   *
   * @param answerInputs The answer input elements.
   * @param target The element that triggered the input event.
   */
  private clearAnswerErrorsOnInput(answerInputs: HTMLInputElement[], target: HTMLElement): void {
    const answerA = answerInputs[0] ?? null;
    const answerB = answerInputs[1] ?? null;
    this.clearSingleAnswerError(0, answerA, this.answerAErrors, target);
    this.clearSingleAnswerError(0, answerB, this.answerBErrors, target);
  }

  /**
   * Removes a single answer error when its input receives valid text.
   *
   * @param index The question index tied to the error map.
   * @param input The answer input element.
   * @param errors The error map to update.
   * @param target The element that triggered the input event.
   */
  private clearSingleAnswerError(
    index: number,
    input: HTMLInputElement | null,
    errors: Record<number, string>,
    target: HTMLElement,
  ): void {
    const hasText = Boolean(input?.value.trim().length);
    if (errors[index] && target === input && hasText) {
      delete errors[index];
    }
  }

  /**
   * Clears all inline validation error states.
   */
  private clearAllErrors(): void {
    this.headlineError = '';
    this.questionErrors = {};
    this.answerAErrors = {};
    this.answerBErrors = {};
  }

  /**
   * Checks whether any inline validation error is currently present.
   *
   * @returns True when at least one validation error exists.
   */
  private hasInlineErrors(): boolean {
    return Boolean(
      this.headlineError ||
      Object.keys(this.questionErrors).length ||
      Object.keys(this.answerAErrors).length ||
      Object.keys(this.answerBErrors).length,
    );
  }

  /**
   * Reads and trims an input value from the form.
   *
   * @param root The form root element.
   * @param selector The selector for the input element.
   * @returns The trimmed input value.
   */
  private readInputValue(root: HTMLElement, selector: string): string {
    const input = root.querySelector(selector) as HTMLInputElement | null;
    return input?.value?.trim() ?? '';
  }

  /**
   * Reads and trims a textarea value from the form.
   *
   * @param root The form root element.
   * @param selector The selector for the textarea element.
   * @returns The trimmed textarea value.
   */
  private readTextareaValue(root: HTMLElement, selector: string): string {
    const textarea = root.querySelector(selector) as HTMLTextAreaElement | null;
    return textarea?.value?.trim() ?? '';
  }

  /**
   * Collects all valid question blocks from the form.
   *
   * @param root The form root element.
   * @returns The list of valid questions.
   */
  private collectQuestions(root: HTMLElement): NewQuestion[] {
    const questionForms = Array.from(root.querySelectorAll('app-question-form'));
    return questionForms
      .map((formEl, index) => this.mapQuestionFormToQuestion(formEl, index))
      .filter((question): question is NewQuestion => question !== null);
  }

  /**
   * Maps a single question form element to a survey question object.
   *
   * @param formEl The question form host element.
    * @param index The zero-based question index.
   * @returns A question object or `null` when the form is incomplete.
   */
    private mapQuestionFormToQuestion(formEl: Element, index: number): NewQuestion | null {
    const questionInput = formEl.querySelector('.form-bottom-question input') as HTMLInputElement | null;
    const answerInputs = Array.from(formEl.querySelectorAll('.answer-form-body app-answer-question-input input')) as HTMLInputElement[];
    const questionText = questionInput?.value?.trim() ?? '';
    const answers = this.readFilledAnswers(answerInputs);

    if (!questionText || answers.length < 2) {
      return null;
    }

    return this.buildQuestion(questionText, answers, index);
  }

  /**
   * Reads all non-empty answer values from a question form.
   *
   * @param answerInputs The answer input elements.
   * @returns The trimmed non-empty answer values.
   */
  private readFilledAnswers(answerInputs: HTMLInputElement[]): string[] {
    return answerInputs
      .map((input) => input.value.trim())
      .filter((value) => value.length > 0);
  }

  /**
   * Builds a `NewQuestion` object from the question text and answer list.
   *
   * @param questionText The question label.
   * @param answers The collected answers.
   * @param index The zero-based question index.
   * @returns The mapped question payload.
   */
  private buildQuestion(questionText: string, answers: string[], index: number): NewQuestion {
    return {
      question: questionText,
      answerA: answers[0],
      answerB: answers[1],
      answerC: answers[2],
      answerD: answers[3],
      allowMultipleAnswers: this.allowMultipleAnswersByQuestion[index] ?? false,
    };
  }

  /**
   * Reindexes multi-answer settings after a question deletion.
   *
   * @param deletedIndex The index that was removed.
   */
  private reindexAllowMultipleSettingsAfterDelete(deletedIndex: number): void {
    const nextMap: Record<number, boolean> = {};

    for (const [rawIndex, value] of Object.entries(this.allowMultipleAnswersByQuestion)) {
      const index = Number(rawIndex);

      if (index < deletedIndex) {
        nextMap[index] = value;
      } else if (index > deletedIndex) {
        nextMap[index - 1] = value;
      }
    }

    this.allowMultipleAnswersByQuestion = nextMap;
  }

  /**
   * Formats a raw `YYYY-MM-DD` date string for display.
   *
   * @param rawDate The raw date string from the native date input.
   * @returns The formatted display date.
   */
  private formatDateForDisplay(rawDate: string): string {
    const [year, month, day] = rawDate.split('-');
    if (!year || !month || !day) {
      return '';
    }

    return `${year}.${month}.${day}`;
  }

  /**
   * Ensures that a raw date string does not point to a day before today.
   *
   * @param rawDate The raw `YYYY-MM-DD` value to validate.
   * @returns The same date when valid or today's date when it is in the past.
   */
  private clampDateToMinSelectable(rawDate: string): string {
    if (!rawDate) {
      return '';
    }

    const minDate = this.minSelectableDate;
    return rawDate < minDate ? minDate : rawDate;
  }

  /**
   * Returns today's date in `YYYY-MM-DD` format for the native date input.
   *
   * @returns Today's raw date string.
   */
  private getTodayRawDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
