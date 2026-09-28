import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { routes } from '../../app.routes';

describe('SidebarComponent', () => {
  it('shows the FocusDay wordmark as the page h1', () => {
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter(routes), provideLocationMocks()],
    });
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(heading.textContent?.trim()).toBe('FocusDay');
  });
});
