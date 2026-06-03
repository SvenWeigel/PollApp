import { Component, inject } from '@angular/core';
import { SurveyItem } from "../survey-item/survey-item";
import { Supabase } from '../../../supabase';

@Component({
  selector: 'app-survey-list',
  imports: [SurveyItem],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
})
export class SurveyList {
  readonly dbService = inject(Supabase);

  ngOnInit(): void {
    this.dbService.getSurveys();
  }
}
