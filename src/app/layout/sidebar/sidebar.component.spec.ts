import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { SidebarOverlayService } from '../../core/services/sidebar-overlay.service';
import { routes } from '../../app.routes';

describe('SidebarComponent', () => {
  function setUp() {
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter(routes), provideLocationMocks()],
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    const overlay = TestBed.inject(SidebarOverlayService);
    fixture.detectChanges();
    return { fixture, overlay };
  }

  function panel(fixture: ReturnType<typeof setUp>['fixture']): HTMLElement {
    return fixture.nativeElement.querySelector('.sidebar');
  }

  function backdrop(fixture: ReturnType<typeof setUp>['fixture']): HTMLElement | null {
    return fixture.nativeElement.querySelector('.sidebar-backdrop');
  }

  function navLinks(fixture: ReturnType<typeof setUp>['fixture']): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.sidebar-nav__link'));
  }

  it('shows the FocusDay wordmark as the page h1', () => {
    const { fixture } = setUp();

    const heading = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(heading.textContent?.trim()).toBe('FocusDay');
  });

  it('renders neither backdrop nor dialog semantics while closed', () => {
    const { fixture } = setUp();

    expect(backdrop(fixture)).toBeNull();
    expect(panel(fixture).classList.contains('sidebar--open')).toBe(false);
    expect(panel(fixture).hasAttribute('role')).toBe(false);
  });

  it('shows a backdrop and dialog semantics once the overlay opens', () => {
    const { fixture, overlay } = setUp();

    overlay.toggle();
    fixture.detectChanges();

    expect(backdrop(fixture)).not.toBeNull();
    expect(panel(fixture).classList.contains('sidebar--open')).toBe(true);
    expect(panel(fixture).getAttribute('role')).toBe('dialog');
    expect(panel(fixture).getAttribute('aria-modal')).toBe('true');
  });

  it('moves focus into the panel when it opens', () => {
    const { fixture, overlay } = setUp();

    overlay.toggle();
    fixture.detectChanges();

    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(navLinks(fixture)[0]);
  });

  it('closes on Escape and returns focus to the registered trigger', () => {
    const { fixture, overlay } = setUp();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    overlay.registerTrigger(trigger);

    overlay.toggle();
    fixture.detectChanges();

    panel(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(overlay.open()).toBe(false);
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('closes when the backdrop is clicked', () => {
    const { fixture, overlay } = setUp();

    overlay.toggle();
    fixture.detectChanges();

    backdrop(fixture)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(overlay.open()).toBe(false);
  });

  it('closes when a navigation entry is selected', () => {
    const { fixture, overlay } = setUp();

    overlay.toggle();
    fixture.detectChanges();

    navLinks(fixture)[1].click();
    fixture.detectChanges();

    expect(overlay.open()).toBe(false);
  });

  it('keeps Tab focus inside the panel: wraps from the last to the first focusable element', () => {
    const { fixture, overlay } = setUp();

    overlay.toggle();
    fixture.detectChanges();

    const links = navLinks(fixture);
    const last = links[links.length - 1];
    last.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    panel(fixture).dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(links[0]);
  });

  it('keeps Tab focus inside the panel: wraps from the first to the last focusable element on Shift+Tab', () => {
    const { fixture, overlay } = setUp();

    overlay.toggle();
    fixture.detectChanges();

    const links = navLinks(fixture);
    links[0].focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    panel(fixture).dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(links[links.length - 1]);
  });

  describe('inert bei schmalem, geschlossenem Viewport', () => {
    function setInnerWidth(width: number): void {
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
      window.dispatchEvent(new Event('resize'));
    }

    it('is inert while closed on a narrow viewport, so its links stay out of the tab order', () => {
      const { fixture } = setUp();
      setInnerWidth(500);
      fixture.detectChanges();

      expect(panel(fixture).inert).toBe(true);
    });

    it('is not inert once opened on a narrow viewport', () => {
      const { fixture, overlay } = setUp();
      setInnerWidth(500);
      overlay.toggle();
      fixture.detectChanges();

      expect(panel(fixture).inert).toBe(false);
    });

    it('is never inert on a wide viewport, even while closed', () => {
      const { fixture } = setUp();
      setInnerWidth(1200);
      fixture.detectChanges();

      expect(panel(fixture).inert).toBe(false);
    });
  });
});
