import { TestBed } from '@angular/core/testing';
import { EinstellungenPageComponent } from './einstellungen-page.component';

describe('EinstellungenPageComponent', () => {
  it('renders its title', () => {
    TestBed.configureTestingModule({ imports: [EinstellungenPageComponent] });

    const fixture = TestBed.createComponent(EinstellungenPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Einstellungen');
  });
});
