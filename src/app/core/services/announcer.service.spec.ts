import { TestBed } from '@angular/core/testing';
import { AnnouncerService } from './announcer.service';

describe('AnnouncerService', () => {
  let service: AnnouncerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnnouncerService);
  });

  it('starts with an empty message', () => {
    expect(service.message()).toBe('');
  });

  it('exposes an announced message asynchronously', () => {
    vi.useFakeTimers();

    service.announce('Aufgabe hinzugefügt.');
    expect(service.message()).toBe('');

    vi.runAllTimers();
    expect(service.message()).toBe('Aufgabe hinzugefügt.');

    vi.useRealTimers();
  });

  it('clears the message before re-announcing the same text, so repeats are still detected as a change', () => {
    vi.useFakeTimers();

    service.announce('Aufgabe gelöscht.');
    vi.runAllTimers();
    expect(service.message()).toBe('Aufgabe gelöscht.');

    service.announce('Aufgabe gelöscht.');
    expect(service.message()).toBe('');

    vi.runAllTimers();
    expect(service.message()).toBe('Aufgabe gelöscht.');

    vi.useRealTimers();
  });
});
