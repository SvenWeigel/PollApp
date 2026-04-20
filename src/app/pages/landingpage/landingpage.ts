import { Component } from '@angular/core';
import { Description } from '../../shared/components/description/description';
import { YourSurveys } from '../../shared/components/your-surveys/your-surveys';
import { SurveyList } from '../../shared/components/survey-list/survey-list';
import { Header } from "../../shared/components/header/header";

@Component({
  selector: 'app-landingpage',
  imports: [Description, YourSurveys, SurveyList, Header],
  templateUrl: './landingpage.html',
  styleUrl: './landingpage.scss',
})
export class Landingpage {}
