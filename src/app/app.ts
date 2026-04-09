import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./shared/components/header/header";
import { Description } from "./shared/components/description/description";
import { YourSurveys } from "./shared/components/your-surveys/your-surveys";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Description, YourSurveys],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('PollApp');
}
