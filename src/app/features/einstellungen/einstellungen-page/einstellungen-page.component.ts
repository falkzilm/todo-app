import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-einstellungen-page',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './einstellungen-page.component.html',
  styleUrl: './einstellungen-page.component.scss',
})
export class EinstellungenPageComponent {}
