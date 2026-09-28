import { TestBed } from '@angular/core/testing';
import { UserCardComponent } from './user-card.component';

describe('UserCardComponent', () => {
  it('shows the default demo user', () => {
    TestBed.configureTestingModule({ imports: [UserCardComponent] });
    const fixture = TestBed.createComponent(UserCardComponent);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.user-card') as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.textContent).toContain('Laura Becker');
    expect(card.textContent).toContain('laura@focusday.de');
  });
});
