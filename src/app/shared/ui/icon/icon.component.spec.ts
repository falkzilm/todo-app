import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';
import { ICONS, IconName } from './icon-registry';

describe('IconComponent', () => {
  function setUp(name: IconName) {
    TestBed.configureTestingModule({
      imports: [IconComponent],
    });

    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();

    return fixture;
  }

  const namesToCheck: IconName[] = ['home', 'calendar', 'check', 'trash', 'plus'];

  it.each(namesToCheck)('renders "%s" as an inline svg with the expected path', (name) => {
    const fixture = setUp(name);

    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).not.toBeNull();

    const paths = Array.from(svg.querySelectorAll('path')).map((path) =>
      (path as Element).getAttribute('d'),
    );
    expect(paths).toEqual(ICONS[name]);
  });

  it('defaults to aria-hidden and focusable="false" when no ariaLabel is set', () => {
    const fixture = setUp('home');

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.getAttribute('aria-label')).toBeNull();
  });

  it('exposes the icon as an accessible image when ariaLabel is set', () => {
    const fixture = setUp('bell');
    fixture.componentRef.setInput('ariaLabel', 'Benachrichtigungen');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(svg.getAttribute('focusable')).toBeNull();
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Benachrichtigungen');
  });

  it('never hardcodes a fill or stroke color on the svg or its paths', () => {
    const fixture = setUp('star');

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('fill')).toBeNull();
    expect(svg.getAttribute('stroke')).toBeNull();
    svg.querySelectorAll('path').forEach((path) => {
      expect(path.getAttribute('fill')).toBeNull();
      expect(path.getAttribute('stroke')).toBeNull();
    });
  });

  it('switches size via the token-based size input', () => {
    const fixture = setUp('home');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.classList.contains('app-icon--sm')).toBe(true);
  });

  it('renders nothing and logs a console error for an unknown icon name', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const fixture = setUp('unbekannt' as IconName);

    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
