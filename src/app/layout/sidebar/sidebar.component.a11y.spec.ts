import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { expectNoA11yViolations } from '../../../testing/axe';
import { routes } from '../../app.routes';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent a11y', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter(routes), provideLocationMocks()],
    }).compileComponents();
  });

  it('has no WCAG 2 A/AA violations with the user menu closed', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });

  it('has no WCAG 2 A/AA violations with the user menu open', async () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const trigger: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.user-card__menu-trigger',
    );
    trigger.click();
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement);
  });
});
