import { JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from "@angular/router";
import { Supabase } from '../../../supabase';

@Component({
  selector: 'app-your-surveys',
  imports: [RouterLink, JsonPipe,],
  templateUrl: './your-surveys.html',
  styleUrl: './your-surveys.scss',
})
export class YourSurveys {
  dbService = inject(Supabase);

  ngOnInit(): void {
    this.dbService.getSurveys();
  }
}
