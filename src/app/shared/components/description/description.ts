import { Component, signal } from '@angular/core';
import { Buttons } from '../buttons/buttons';

@Component({
  selector: 'app-description',
  imports: [Buttons],
  templateUrl: './description.html',
  styleUrl: './description.scss',
})
export class Description {
  private readonly defaultPhoneImage = './assets/mobile-phone-logo.svg';
  private readonly hoverPhoneImage = './assets/mobile-phone-logo-move.svg';

  readonly phoneImageSrc = signal(this.defaultPhoneImage);

  onImageEnter(): void {
    this.phoneImageSrc.set(this.hoverPhoneImage);
  }

  onImageLeave(): void {
    this.phoneImageSrc.set(this.defaultPhoneImage);
  }
}
