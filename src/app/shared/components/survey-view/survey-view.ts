import { Component } from '@angular/core';
import { Buttons } from "../buttons/buttons";
import { SurveyViewQuestion } from "../survey-view-question/survey-view-question";

@Component({
  selector: 'app-survey-view',
  imports: [Buttons, SurveyViewQuestion],
  templateUrl: './survey-view.html',
  styleUrl: './survey-view.scss',
})
export class SurveyView {}
