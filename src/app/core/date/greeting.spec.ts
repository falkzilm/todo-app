import { getTimeOfDayGreeting } from './greeting';

describe('getTimeOfDayGreeting', () => {
  it('returns "Guten Morgen" at midnight', () => {
    expect(getTimeOfDayGreeting(new Date(2026, 8, 2, 0, 0, 0))).toBe('Guten Morgen');
  });

  it('returns "Guten Morgen" just before the morning/day boundary', () => {
    expect(getTimeOfDayGreeting(new Date(2026, 8, 2, 10, 59, 59))).toBe('Guten Morgen');
  });

  it('returns "Guten Tag" exactly at 11:00', () => {
    expect(getTimeOfDayGreeting(new Date(2026, 8, 2, 11, 0, 0))).toBe('Guten Tag');
  });

  it('returns "Guten Tag" just before the day/evening boundary', () => {
    expect(getTimeOfDayGreeting(new Date(2026, 8, 2, 17, 59, 59))).toBe('Guten Tag');
  });

  it('returns "Guten Abend" exactly at 18:00', () => {
    expect(getTimeOfDayGreeting(new Date(2026, 8, 2, 18, 0, 0))).toBe('Guten Abend');
  });

  it('returns "Guten Abend" late at night', () => {
    expect(getTimeOfDayGreeting(new Date(2026, 8, 2, 23, 59, 59))).toBe('Guten Abend');
  });
});
