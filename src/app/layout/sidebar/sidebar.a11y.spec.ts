import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { expectNoA11yViolations } from '../../../testing/axe';
import { routes } from '../../app.routes';
import { SidebarComponent } from './sidebar.component';
import { SidebarOverlayService } from '../../core/services/sidebar-overlay.service';

describe('SidebarComponent a11y', () => {
  async function setUp() {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter(routes), provideLocationMocks()],
    }).compileComponents();

    const fixture = TestBed.createComponent(SidebarComponent);
    const overlay = TestBed.inject(SidebarOverlayService);
    fixture.detectChanges();
    return { fixture, overlay };
  }

  it('has no WCAG 2 A/AA violations while closed', async () => {
    const { fixture } = await setUp();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations while open as an overlay', async () => {
    const { fixture, overlay } = await setUp();

    overlay.toggle();
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
