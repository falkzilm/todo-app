import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AnnouncerService } from './core/services/announcer.service';
import { StorageStatusService } from './core/services/storage-status.service';

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

  it('shows no storage hint while storage is available', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.storage-notice')).toBeNull();
  });

  it('shows a non-blocking hint when storage is unavailable', () => {
    const fixture = TestBed.createComponent(AppComponent);
    TestBed.inject(StorageStatusService).markInMemoryMode();
    fixture.detectChanges();

    const notice = fixture.nativeElement.querySelector('.storage-notice');
    expect(notice).not.toBeNull();
    expect(notice.getAttribute('role')).toBe('status');
    expect(notice.textContent).toContain('werden');
  });

  it('offers a skip link as the very first focusable element, pointing at the main landmark', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const skipLink = fixture.nativeElement.querySelector('a.skip-link') as HTMLAnchorElement;
    const main = fixture.nativeElement.querySelector('main') as HTMLElement;

    expect(skipLink).not.toBeNull();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
    expect(main.id).toBe('main-content');
  });

  it('renders an always-present live region that announces messages from the AnnouncerService', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const liveRegion = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(liveRegion).not.toBeNull();
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion.textContent?.trim()).toBe('');

    TestBed.inject(AnnouncerService).announce('„Milch kaufen“ hinzugefügt.');
    vi.runAllTimers();
    fixture.detectChanges();

    expect(liveRegion.textContent?.trim()).toBe('„Milch kaufen“ hinzugefügt.');

    vi.useRealTimers();
  });
});
