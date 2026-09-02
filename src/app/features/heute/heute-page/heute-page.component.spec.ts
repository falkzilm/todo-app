import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TaskStoreService } from '../../../core/services/task-store.service';
import { HeutePageComponent } from './heute-page.component';

describe('HeutePageComponent', () => {
  it('renders with a mocked store without error', () => {
    const mockStore: Partial<TaskStoreService> = {
      todayTasks: signal([]),
    };

    TestBed.configureTestingModule({
      imports: [HeutePageComponent],
      providers: [{ provide: TaskStoreService, useValue: mockStore }],
    });

    const fixture = TestBed.createComponent(HeutePageComponent);

    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('shows the current date, correctly formatted', () => {
    const mockStore: Partial<TaskStoreService> = {
      todayTasks: signal([]),
    };

    TestBed.configureTestingModule({
      imports: [HeutePageComponent],
      providers: [{ provide: TaskStoreService, useValue: mockStore }],
    });

    const fixture = TestBed.createComponent(HeutePageComponent);
    fixture.detectChanges();

    const expectedLabel = new Date().toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    expect(fixture.nativeElement.textContent).toContain(expectedLabel);
  });
});
