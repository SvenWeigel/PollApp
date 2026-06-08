import { Component } from '@angular/core';

@Component({
  selector: 'app-text-area',
  imports: [],
  templateUrl: './text-area.html',
  styleUrl: './text-area.scss',
})
export class TextArea {

  /**
   * Clears the current value of the textarea element.
   *
   * @param textArea The textarea element to reset.
   */
  clearInput(textArea: HTMLTextAreaElement) {
    textArea.value = '';
  }
}
