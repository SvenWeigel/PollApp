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

  private isHoverDevice(): boolean {
    if (typeof window === 'undefined' || !('matchMedia' in window)) {
      return false;
    }

    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  onImageEnter(): void {
    if (!this.isHoverDevice()) {
      return;
    }

    this.phoneImageSrc.set(this.hoverPhoneImage);
  }

  onImageLeave(): void {
    if (!this.isHoverDevice()) {
      return;
    }

    this.phoneImageSrc.set(this.defaultPhoneImage);
  }

}
