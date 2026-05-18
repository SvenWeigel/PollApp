import { Component, input } from '@angular/core';
import { InputField } from "../input-field/input-field";

@Component({
  selector: 'app-answer-question-input',
  imports: [InputField],
  templateUrl: './answer-question-input.html',
  styleUrl: './answer-question-input.scss',
})
export class AnswerQuestionInput {
  readonly label = input<'A' | 'B' | 'C' | 'D'>('A');
}
