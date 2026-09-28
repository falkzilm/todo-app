import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { AvatarComponent } from '../../../shared/ui/avatar/avatar.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';

let nextId = 0;

/**
 * Nutzerkarte am Fuß der Sidebar (TDP-26): zeigt Avatar, Name und E-Mail aus
 * dem Nutzerprofil-Service und öffnet über den Chevron ein kleines Menü.
 * Bewusst ohne "Abmelden" (kein Login in dieser Demo-App) - stattdessen
 * "Einstellungen" (Navigation) und "Demodaten zurücksetzen" (bestehende
 * `TaskStoreService.reset()`, mit Bestätigung wie im Aufgaben-Reset-Button).
 */
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [AvatarComponent, IconComponent, RouterLink],
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
})
export class UserCardComponent {
  private readonly userProfile = inject(UserProfileService);
  private readonly taskStore = inject(TaskStoreService);
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly displayName = this.userProfile.displayName;
  protected readonly email = this.userProfile.email;
  protected readonly avatarSrc = computed(() => this.userProfile.avatarSrc() ?? undefined);

  protected readonly menuId = `user-card-menu-${nextId++}`;
  protected readonly open = signal(false);

  private readonly triggerButton = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  protected toggle(): void {
    const willOpen = !this.open();
    this.open.set(willOpen);
    if (willOpen) {
      afterNextRender(() => this.focusFirstItem(), { injector: this.injector });
    }
  }

  protected closeAndFocusTrigger(): void {
    this.open.set(false);
    this.triggerButton().nativeElement.focus();
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeAndFocusTrigger();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.focusSibling(event.key === 'ArrowDown' ? 1 : -1);
    }
  }

  /** Closes without moving focus back to the trigger, since focus already left the menu on its own (e.g. Tab). */
  protected onMenuFocusOut(event: FocusEvent): void {
    const nextFocus = event.relatedTarget as Node | null;
    if (nextFocus && this.menu()?.nativeElement.contains(nextFocus)) {
      return;
    }
    this.open.set(false);
  }

  protected onSettingsSelect(): void {
    this.open.set(false);
  }

  protected onResetDemoData(): void {
    const confirmed = window.confirm('Alle Aufgaben löschen und auf die Demo-Daten zurücksetzen?');
    if (confirmed) {
      this.taskStore.reset();
    }
    this.closeAndFocusTrigger();
  }

  /**
   * Guarded by `open()`: the menu can already have closed again (e.g. via
   * Escape) by the time this post-render callback runs, and focusing a menu
   * item that's about to be removed from the DOM would drop focus to `body`
   * instead of leaving it on whatever closing already focused.
   */
  private focusFirstItem(): void {
    if (!this.open()) {
      return;
    }
    this.menuItems()[0]?.focus();
  }

  private focusSibling(delta: number): void {
    const items = this.menuItems();
    if (items.length === 0) {
      return;
    }

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + delta + items.length) % items.length;
    items[nextIndex]?.focus();
  }

  private menuItems(): HTMLElement[] {
    const menu = this.menu()?.nativeElement;
    if (!menu) {
      return [];
    }
    return Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  }
}
