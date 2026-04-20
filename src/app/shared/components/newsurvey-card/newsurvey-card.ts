import { Component } from '@angular/core';
import { NewsurveyCardHeader } from "../newsurvey-card-header/newsurvey-card-header";
import { NewsurveyCardForm } from "../newsurvey-card-form/newsurvey-card-form";

@Component({
  selector: 'app-newsurvey-card',
  imports: [NewsurveyCardHeader, NewsurveyCardForm],
  templateUrl: './newsurvey-card.html',
  styleUrl: './newsurvey-card.scss',
})
export class NewsurveyCard {}
