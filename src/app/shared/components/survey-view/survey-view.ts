import { Component } from '@angular/core';
import { Buttons } from "../buttons/buttons";
import { SurveyViewQuestion } from "../survey-view-question/survey-view-question";
import { SurveyViewChart } from "../survey-view-chart/survey-view-chart";

@Component({
  selector: 'app-survey-view',
  imports: [Buttons, SurveyViewQuestion, SurveyViewChart],
  templateUrl: './survey-view.html',
  styleUrl: './survey-view.scss',
})
export class SurveyView {}
