import { Component } from '@angular/core';
import { NewsurveyCardHeader } from "../newsurvey-card-header/newsurvey-card-header";

@Component({
  selector: 'app-newsurvey-card',
  imports: [NewsurveyCardHeader],
  templateUrl: './newsurvey-card.html',
  styleUrl: './newsurvey-card.scss',
})
export class NewsurveyCard {}
