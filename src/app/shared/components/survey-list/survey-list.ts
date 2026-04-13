import { Component } from '@angular/core';
import { SurveyItem } from "../survey-item/survey-item";

@Component({
  selector: 'app-survey-list',
  imports: [SurveyItem],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList {}
