import { Component, Input } from '@angular/core';
import { Buttons } from '../buttons/buttons';

@Component({
  selector: 'app-header',
  imports: [Buttons],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Input() showButton: boolean = true;
  @Input() buttonText: string = 'New survey';
}
