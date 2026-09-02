import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes), provideLocationMocks()],
    }).compileComponents();
  });

  it('redirects / to /heute', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/');

    expect(router.url).toBe('/heute');
  });

  it('marks the active nav link with aria-current and the active class', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/kalender');
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('nav a') as NodeListOf<HTMLAnchorElement>;
    const [heuteLink, kalenderLink] = Array.from(links);

    expect(kalenderLink.classList.contains('is-active')).toBe(true);
    expect(kalenderLink.getAttribute('aria-current')).toBe('page');
    expect(heuteLink.classList.contains('is-active')).toBe(false);
    expect(heuteLink.hasAttribute('aria-current')).toBe(false);
  });

  it('renders the fallback page for unknown paths', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/does-not-exist');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain(
      'Seite nicht gefunden',
    );
  });
});
