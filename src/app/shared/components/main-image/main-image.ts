import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-main-image',
  templateUrl: './main-image.html',
  styleUrl: './main-image.scss',
})
export class MainImage {
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
