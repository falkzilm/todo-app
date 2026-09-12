import { Component, computed, input } from '@angular/core';
import { ICON_VIEW_BOX, ICONS, IconName } from './icon-registry';

export type { IconName } from './icon-registry';

export type IconSize = 'xs' | 'sm' | 'md';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize>('md');
  readonly ariaLabel = input<string>();

  protected readonly viewBox = ICON_VIEW_BOX;

  protected readonly paths = computed(() => {
    const paths = ICONS[this.name()];
    if (!paths) {
      console.error(`app-icon: unbekanntes Icon "${this.name()}"`);
      return null;
    }
    return paths;
  });
}
