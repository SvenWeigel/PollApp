import { Component, input, Input } from '@angular/core';

@Component({
  selector: 'app-input-field',
  imports: [],
  templateUrl: './input-field.html',
  styleUrl: './input-field.scss',
})
export class InputField {
  @Input() showIcon: boolean = true;
  @Input() iconSrc: string = '../assets/Delete.svg';
  @Input() inputWidth: string = '100%';
  @Input() inputHeight: string = '37px';
  @Input() placeholder: string = '';
  @Input() inputMaxWidth: string = '429px';
}
