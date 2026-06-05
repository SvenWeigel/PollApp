import { Component } from '@angular/core';
import { Buttons } from '../buttons/buttons';
import { RouterLink } from "@angular/router";
import { MainImage } from "../main-image/main-image";

@Component({
  selector: 'app-description',
  imports: [Buttons, RouterLink, MainImage],
  templateUrl: './description.html',
  styleUrl: './description.scss',
})
export class Description {
}
