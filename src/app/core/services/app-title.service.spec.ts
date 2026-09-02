import { TestBed } from '@angular/core/testing';
import { AppTitleService } from './app-title.service';

describe('AppTitleService', () => {
  let service: AppTitleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppTitleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to "ToDo App"', () => {
    expect(service.title()).toBe('ToDo App');
  });

  it('should update document.title when the title signal changes', () => {
    service.title.set('New Title');
    TestBed.tick();

    expect(document.title).toBe('New Title');
  });
});
