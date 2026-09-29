import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { SidebarNavComponent } from './sidebar-nav.component';
import { routes } from '../../../app.routes';

describe('SidebarNavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarNavComponent],
      providers: [provideRouter(routes), provideLocationMocks()],
    }).compileComponents();
  });

  it('renders all five entries in order with their labels and icons', () => {
    const fixture = TestBed.createComponent(SidebarNavComponent);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(fixture.nativeElement.querySelector('nav > ul')).toBeTruthy();

    const items = fixture.nativeElement.querySelectorAll('li');
    const labels = Array.from(items as NodeListOf<HTMLLIElement>).map((item) =>
      item.querySelector('.sidebar-nav__label')?.textContent?.trim(),
    );

    expect(labels).toEqual(['Dashboard', 'Aufgaben', 'Kalender', 'Projekte', 'Einstellungen']);

    for (const item of Array.from(items as NodeListOf<HTMLLIElement>)) {
      expect(item.querySelector('app-icon')).toBeTruthy();
    }
  });

  it('marks the active nav link with aria-current and the active class', async () => {
    const fixture = TestBed.createComponent(SidebarNavComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/kalender');
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const [, aufgabenLink, kalenderLink] = Array.from(links);

    expect(kalenderLink.classList.contains('is-active')).toBe(true);
    expect(kalenderLink.getAttribute('aria-current')).toBe('page');
    expect(aufgabenLink.classList.contains('is-active')).toBe(false);
    expect(aufgabenLink.hasAttribute('aria-current')).toBe(false);
  });

  it('marks exactly one entry as active for a different route', async () => {
    const fixture = TestBed.createComponent(SidebarNavComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/projekte');
    fixture.detectChanges();

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>,
    );
    const activeLinks = links.filter((link) => link.classList.contains('is-active'));

    expect(activeLinks.length).toBe(1);
    expect(activeLinks[0].getAttribute('aria-current')).toBe('page');
    expect(activeLinks[0].textContent).toContain('Projekte');
  });
});
