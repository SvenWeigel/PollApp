import { Component, input } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss',
})
export class Buttons {
  readonly buttonText = input<string>('New survey');
  readonly buttonBgColor = input<string>('var(--color--s-o)');
  readonly showButton = input<boolean>(true);
  readonly enableHoverEffect = input<boolean>(false);
  readonly hoverIconSrc = input<string>('');
  readonly hoverIconAlt = input<string>('');
}
