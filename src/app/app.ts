import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./shared/components/header/header";
import { Description } from "./shared/components/description/description";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Description],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('PollApp');
}
