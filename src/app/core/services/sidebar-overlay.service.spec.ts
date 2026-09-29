import { TestBed } from '@angular/core/testing';
import { SIDEBAR_COLLAPSE_BREAKPOINT_PX, SidebarOverlayService } from './sidebar-overlay.service';

describe('SidebarOverlayService', () => {
  let service: SidebarOverlayService;
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarOverlayService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
  });

  function setInnerWidth(width: number): void {
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
    window.dispatchEvent(new Event('resize'));
  }

  it('starts closed', () => {
    expect(service.open()).toBe(false);
  });

  it('toggles open and closed', () => {
    service.toggle();
    expect(service.open()).toBe(true);

    service.toggle();
    expect(service.open()).toBe(false);
  });

  it('focuses the registered trigger when closing', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');

    service.registerTrigger(trigger);
    service.toggle();
    service.close();

    expect(focusSpy).toHaveBeenCalled();
    trigger.remove();
  });

  it('does nothing when closing while already closed', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const focusSpy = vi.spyOn(trigger, 'focus');

    service.registerTrigger(trigger);
    service.close();

    expect(focusSpy).not.toHaveBeenCalled();
    trigger.remove();
  });

  it('auto-closes when the viewport grows past the sidebar breakpoint', () => {
    service.toggle();
    expect(service.open()).toBe(true);

    setInnerWidth(SIDEBAR_COLLAPSE_BREAKPOINT_PX);
    expect(service.open()).toBe(false);
  });

  it('stays open when the viewport is resized but still narrow', () => {
    service.toggle();
    expect(service.open()).toBe(true);

    setInnerWidth(SIDEBAR_COLLAPSE_BREAKPOINT_PX - 1);
    expect(service.open()).toBe(true);
  });

  it('tracks whether the viewport is below the sidebar breakpoint', () => {
    setInnerWidth(SIDEBAR_COLLAPSE_BREAKPOINT_PX - 1);
    expect(service.narrowViewport()).toBe(true);

    setInnerWidth(SIDEBAR_COLLAPSE_BREAKPOINT_PX);
    expect(service.narrowViewport()).toBe(false);
  });
});
