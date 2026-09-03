import { TestBed } from '@angular/core/testing';
import { StorageStatusService } from './storage-status.service';

describe('StorageStatusService', () => {
  let service: StorageStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageStatusService);
  });

  it('starts out available', () => {
    expect(service.unavailable()).toBe(false);
    expect(service.inMemoryMode()).toBe(false);
    expect(service.saveFailed()).toBe(false);
  });

  it('marks storage unavailable permanently once in-memory mode is entered', () => {
    service.markInMemoryMode();

    expect(service.inMemoryMode()).toBe(true);
    expect(service.unavailable()).toBe(true);

    service.markSaveSucceeded();

    expect(service.inMemoryMode()).toBe(true);
    expect(service.unavailable()).toBe(true);
  });

  it('marks and clears a transient save failure', () => {
    service.markSaveFailed();
    expect(service.unavailable()).toBe(true);

    service.markSaveSucceeded();
    expect(service.unavailable()).toBe(false);
  });
});
