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

  it('marks the active nav link with aria-current and the active class', async () => {
    const fixture = TestBed.createComponent(SidebarNavComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/kalender');
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll(
      'a',
    ) as NodeListOf<HTMLAnchorElement>;
    const [heuteLink, kalenderLink] = Array.from(links);

    expect(kalenderLink.classList.contains('is-active')).toBe(true);
    expect(kalenderLink.getAttribute('aria-current')).toBe('page');
    expect(heuteLink.classList.contains('is-active')).toBe(false);
    expect(heuteLink.hasAttribute('aria-current')).toBe(false);
  });
});
