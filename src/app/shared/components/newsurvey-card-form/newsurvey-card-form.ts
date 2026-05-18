import { Component } from '@angular/core';
import { InputField } from "../input-field/input-field";
import { TextArea } from "../text-area/text-area";
import { QuestionForm } from "../question-form/question-form";
import { Buttons } from "../buttons/buttons";

@Component({
  selector: 'app-newsurvey-card-form',
  imports: [InputField, TextArea, QuestionForm, Buttons,],
  templateUrl: './newsurvey-card-form.html',
  styleUrl: './newsurvey-card-form.scss',
})
export class NewsurveyCardForm {
  questions = [0];

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
}
