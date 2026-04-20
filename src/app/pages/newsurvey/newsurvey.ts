import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NewsurveyCard } from "../../shared/components/newsurvey-card/newsurvey-card";

@Component({
  selector: 'app-newsurvey',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NewsurveyCard],
  templateUrl: './newsurvey.html',
  styleUrl: './newsurvey.scss',
})
export class Newsurvey implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);

  ngOnInit(): void {
    this.document.body.classList.add('newsurvey-body');
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('newsurvey-body');
  }
}
