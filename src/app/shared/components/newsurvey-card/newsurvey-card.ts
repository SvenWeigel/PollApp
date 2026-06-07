import { Component, ViewChild, inject } from '@angular/core';
import { NewsurveyCardHeader } from "../newsurvey-card-header/newsurvey-card-header";
import { NewsurveyCardForm } from "../newsurvey-card-form/newsurvey-card-form";
import { Buttons } from "../buttons/buttons";
import { Router } from "@angular/router";
import { Header } from "../header/header";

@Component({
  selector: 'app-newsurvey-card',
  imports: [NewsurveyCardHeader, NewsurveyCardForm, Buttons, Header],
  templateUrl: './newsurvey-card.html',
  styleUrl: './newsurvey-card.scss',
})
export class NewsurveyCard {
  @ViewChild(NewsurveyCardForm) form?: NewsurveyCardForm;
  private readonly router = inject(Router);

  async publish(): Promise<void> {
    if (!this.form) {
      return;
    }

    const success = await this.form.publishSurvey();
    if (success) {
      await this.router.navigateByUrl('/');
    }
  }
}
