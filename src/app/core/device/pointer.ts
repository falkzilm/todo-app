/**
 * Heuristic touch detection used to gate HTML5 drag & drop (DEMOPROJEK-45):
 * native drag-and-drop is designed for mice, and on some touch browsers a
 * long-press drag can intercept normal scrolling. Rather than relying on
 * that being mouse-only everywhere, disable it outright on touch-capable
 * devices; the keyboard-based rescheduling alternatives remain available.
 *
 * `navigator.maxTouchPoints` is used rather than `'ontouchstart' in window`:
 * the latter is present on plenty of non-touch browsers (including jsdom, as
 * used by this project's component tests) and would misidentify them as touch.
 */
export function isTouchDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return navigator.maxTouchPoints > 0;
}
