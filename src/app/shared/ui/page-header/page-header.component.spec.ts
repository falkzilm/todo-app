import { TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';
import { SidebarOverlayService } from '../../../core/services/sidebar-overlay.service';

describe('PageHeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Tasks');
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the title', () => {
    const fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Tasks');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Tasks');
  });

  it('should render the subtitle only when provided', () => {
    const fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Tasks');
    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-header__subtitle')).toBeNull();

    fixture.componentRef.setInput('subtitle', 'Manage your tasks');
    fixture.detectChanges();

    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-header__subtitle')?.textContent).toContain(
      'Manage your tasks',
    );
  });

  it('renders the greeting only when provided', () => {
    const fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Tasks');
    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-header__greeting')).toBeNull();

    fixture.componentRef.setInput('greeting', 'Guten Morgen, Laura! 👋');
    fixture.detectChanges();

    compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-header__greeting')?.textContent).toContain(
      'Guten Morgen, Laura! 👋',
    );
  });

  describe('Hamburger-Button (TDP-27)', () => {
    function toggle(fixture: ReturnType<typeof TestBed.createComponent<PageHeaderComponent>>) {
      return fixture.nativeElement.querySelector(
        '.page-header__sidebar-toggle button',
      ) as HTMLButtonElement;
    }

    it('toggles the sidebar overlay and reflects its state via aria-expanded/aria-controls', () => {
      const fixture = TestBed.createComponent(PageHeaderComponent);
      fixture.componentRef.setInput('title', 'Tasks');
      fixture.detectChanges();
      const overlay = TestBed.inject(SidebarOverlayService);

      expect(toggle(fixture).getAttribute('aria-expanded')).toBe('false');
      expect(toggle(fixture).getAttribute('aria-controls')).toBe('app-sidebar');

      toggle(fixture).click();
      fixture.detectChanges();

      expect(overlay.open()).toBe(true);
      expect(toggle(fixture).getAttribute('aria-expanded')).toBe('true');
    });

    it('registers itself as the focus target the overlay returns to on close', () => {
      const fixture = TestBed.createComponent(PageHeaderComponent);
      fixture.componentRef.setInput('title', 'Tasks');
      fixture.detectChanges();
      const overlay = TestBed.inject(SidebarOverlayService);

      overlay.toggle();
      overlay.close();

      expect(fixture.nativeElement.ownerDocument.activeElement).toBe(toggle(fixture));
    });
  });
});
