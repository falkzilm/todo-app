import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { expectNoA11yViolations } from '../../../../testing/axe';
import { routes } from '../../../app.routes';
import { SidebarNavComponent } from './sidebar-nav.component';

describe('SidebarNavComponent a11y', () => {
  it('has no WCAG 2 A/AA violations', async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarNavComponent],
      providers: [provideRouter(routes), provideLocationMocks()],
    }).compileComponents();

    const fixture = TestBed.createComponent(SidebarNavComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
