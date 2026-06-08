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

  /**
   * Detects whether the current device supports desktop-style hover interactions.
   *
   * @returns True when hover and fine pointer input are available.
   */
  private isHoverDevice(): boolean {
    if (typeof window === 'undefined' || !('matchMedia' in window)) {
      return false;
    }

    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  /**
   * Switches to the hover image when the pointer enters on hover-capable devices.
   */
  onImageEnter(): void {
    if (!this.isHoverDevice()) {
      return;
    }

    this.phoneImageSrc.set(this.hoverPhoneImage);
  }

  /**
   * Restores the default image when the pointer leaves on hover-capable devices.
   */
  onImageLeave(): void {
    if (!this.isHoverDevice()) {
      return;
    }

    this.phoneImageSrc.set(this.defaultPhoneImage);
  }

}
