import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-aufgaben-page',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './aufgaben-page.component.html',
  styleUrl: './aufgaben-page.component.scss',
})
export class AufgabenPageComponent {}
