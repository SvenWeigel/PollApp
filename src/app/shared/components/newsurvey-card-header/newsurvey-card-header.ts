import { Component } from '@angular/core';
import { Buttons } from "../buttons/buttons";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-newsurvey-card-header',
  imports: [Buttons, RouterLink],
  templateUrl: './newsurvey-card-header.html',
  styleUrl: './newsurvey-card-header.scss',
})
export class NewsurveyCardHeader {}
