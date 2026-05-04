import { Component, DOCUMENT, inject, OnDestroy, OnInit } from '@angular/core';
import { Header } from '../../shared/components/header/header';
import { Buttons } from '../../shared/components/buttons/buttons';
import { SurveyView } from "../../shared/components/survey-view/survey-view";

@Component({
  selector: 'app-survey',
  imports: [Header, SurveyView],
  templateUrl: './survey.html',
  styleUrl: './survey.scss',
})
export class Survey implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);

  ngOnInit(): void {
    this.document.body.classList.add('survey-body');
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('survey-body');
  }
}
