import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AvatarComponent, initialsFromName } from './avatar.component';

@Component({
  standalone: true,
  imports: [AvatarComponent],
  template: `<app-avatar [name]="name" [src]="src" [decorative]="decorative" />`,
})
class HostComponent {
  name = 'Laura Becker';
  src: string | undefined = undefined;
  decorative = false;
}

describe('initialsFromName', () => {
  it('bildet Initialen aus zweiteiligen Namen (erster + letzter Buchstabe)', () => {
    expect(initialsFromName('Laura Becker')).toBe('LB');
  });

  it('bildet Initialen aus mehrteiligen Namen (erster + letzter Buchstabe)', () => {
    expect(initialsFromName('Anna Maria Schmidt')).toBe('AS');
  });

  it('bildet die Initiale aus einteiligen Namen', () => {
    expect(initialsFromName('Cher')).toBe('C');
  });
});

describe('AvatarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
  });

  it('rendert ohne src die Initialen zentriert auf getönter Fläche', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const initials = compiled.querySelector('.app-avatar__initials');
    expect(initials?.textContent?.trim()).toBe('LB');
    expect(compiled.querySelector('.app-avatar__image')).toBeNull();
  });

  it('rendert mit src das Bild rund beschnitten statt der Initialen', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.src = '/assets/laura.png';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const image = compiled.querySelector('.app-avatar__image') as HTMLImageElement;
    expect(image).not.toBeNull();
    expect(image.src).toContain('/assets/laura.png');
    expect(compiled.querySelector('.app-avatar__initials')).toBeNull();
  });

  it('faellt nach fehlgeschlagenem Bildladen auf die Initialen zurueck', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.src = '/assets/broken.png';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const image = compiled.querySelector('.app-avatar__image') as HTMLImageElement;
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(compiled.querySelector('.app-avatar__image')).toBeNull();
    expect(compiled.querySelector('.app-avatar__initials')?.textContent?.trim()).toBe('LB');
  });

  it('ist dekorativ (aria-hidden) ausgezeichnet, wenn der Name daneben sichtbar steht', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.decorative = true;
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('.app-avatar') as HTMLElement;
    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelector('.app-avatar__initials')?.getAttribute('aria-label')).toBeNull();
  });

  it('traegt ohne sichtbaren Namen ein ariaLabel auf den Initialen', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('.app-avatar') as HTMLElement;
    expect(host.getAttribute('aria-hidden')).toBeNull();
    expect(host.querySelector('.app-avatar__initials')?.getAttribute('aria-label')).toBe(
      'Laura Becker',
    );
  });

  it('traegt bei einem Bild den alt-Text statt eines separaten ariaLabel', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.src = '/assets/laura.png';
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('.app-avatar__image') as HTMLImageElement;
    expect(image.alt).toBe('Laura Becker');
  });
});
