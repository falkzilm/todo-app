import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Stub für die Sidebar-Navigation (TDP-23): trägt vorerst nur die
 * bestehenden Routen. Das vollständige Icon-/Item-Set aus dem Referenzbild
 * (Dashboard, Aufgaben, Projekte, Einstellungen, …) landet in einem
 * Folge-Ticket, das ausschließlich in diesem Ordner arbeitet.
 */
@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.scss',
})
export class SidebarNavComponent {}
