import { Component, Input } from '@angular/core';
import { Buttons } from '../buttons/buttons';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-header',
  imports: [Buttons, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Input() showButton: boolean = true;
  @Input() buttonText: string = 'New survey';
  @Input() logoSrc: string = '../assets/logo-orange.svg';
}
