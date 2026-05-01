import { Component, DOCUMENT, inject, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-survey',
  imports: [],
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
