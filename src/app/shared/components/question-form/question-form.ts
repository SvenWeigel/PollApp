import { Component, Input } from '@angular/core';
import { InputField } from "../input-field/input-field";

@Component({
  selector: 'app-question-form',
  imports: [InputField],
  templateUrl: './question-form.html',
  styleUrl: './question-form.scss',
})
export class QuestionForm {
}
