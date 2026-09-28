import { TestBed } from '@angular/core/testing';
import { ProjektePageComponent } from './projekte-page.component';

describe('ProjektePageComponent', () => {
  it('renders its title', () => {
    TestBed.configureTestingModule({ imports: [ProjektePageComponent] });

    const fixture = TestBed.createComponent(ProjektePageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Projekte');
  });
});
