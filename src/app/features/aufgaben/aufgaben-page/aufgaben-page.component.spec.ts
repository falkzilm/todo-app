import { TestBed } from '@angular/core/testing';
import { AufgabenPageComponent } from './aufgaben-page.component';

describe('AufgabenPageComponent', () => {
  it('renders its title', () => {
    TestBed.configureTestingModule({ imports: [AufgabenPageComponent] });

    const fixture = TestBed.createComponent(AufgabenPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Aufgaben');
  });
});
