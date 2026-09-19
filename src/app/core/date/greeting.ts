export type TimeOfDayGreeting = 'Guten Morgen' | 'Guten Tag' | 'Guten Abend';

const MORNING_ENDS_AT_HOUR = 11;
const AFTERNOON_ENDS_AT_HOUR = 18;

/**
 * Resolves a German time-of-day greeting for `reference`'s local hour:
 * "Guten Morgen" before 11:00, "Guten Tag" before 18:00, otherwise "Guten Abend".
 */
export function getTimeOfDayGreeting(reference: Date): TimeOfDayGreeting {
  const hour = reference.getHours();

  if (hour < MORNING_ENDS_AT_HOUR) {
    return 'Guten Morgen';
  }
  if (hour < AFTERNOON_ENDS_AT_HOUR) {
    return 'Guten Tag';
  }
  return 'Guten Abend';
}
