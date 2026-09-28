import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-projekte-page',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './projekte-page.component.html',
  styleUrl: './projekte-page.component.scss',
})
export class ProjektePageComponent {}
