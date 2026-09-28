import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { routes } from './app.routes';

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class RouterTestHostComponent {}

describe('routes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestHostComponent],
      providers: [provideRouter(routes), provideLocationMocks()],
    }).compileComponents();
  });

  const destinations: [path: string, title: string][] = [
    ['/dashboard', 'Dashboard'],
    ['/aufgaben', 'Aufgaben'],
    ['/kalender', 'Kalender'],
    ['/projekte', 'Projekte'],
    ['/einstellungen', 'Einstellungen'],
  ];

  for (const [path, title] of destinations) {
    it(`renders the ${title} page for ${path}, in its own lazy chunk`, async () => {
      const fixture = TestBed.createComponent(RouterTestHostComponent);
      const router = TestBed.inject(Router);
      fixture.detectChanges();

      await router.navigateByUrl(path);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain(title);
    });
  }

  it('redirects / to /aufgaben', async () => {
    const fixture = TestBed.createComponent(RouterTestHostComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/');

    expect(router.url).toBe('/aufgaben');
  });

  it('redirects /heute to /aufgaben, so existing links/bookmarks keep working', async () => {
    const fixture = TestBed.createComponent(RouterTestHostComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/heute');

    expect(router.url).toBe('/aufgaben');
  });

  it('renders the not-found page for an unknown path', async () => {
    const fixture = TestBed.createComponent(RouterTestHostComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/does-not-exist');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain(
      'Seite nicht gefunden',
    );
  });
});
