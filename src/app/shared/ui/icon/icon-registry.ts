// Inline-Icon-Set im Line-Icon-Stil des Designs: 2px-Strichstärke, abgerundete
// Enden, currentColor (siehe icon.component.scss), 24px-Viewbox. Jedes Icon
// besteht ausschließlich aus <path>-Elementen, damit die Vorlage sie
// gleichförmig rendern kann und kein Icon eine eigene Füll-/Strichfarbe trägt.

export type IconName =
  | 'home'
  | 'check-square'
  | 'calendar'
  | 'clipboard-list'
  | 'settings'
  | 'bell'
  | 'sun'
  | 'calendar-range'
  | 'star'
  | 'sliders'
  | 'clock'
  | 'flag'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'check'
  | 'users'
  | 'file'
  | 'trash'
  | 'plus';

export const ICON_VIEW_BOX = '0 0 24 24';

export const ICONS: Record<IconName, readonly string[]> = {
  home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22L9 12L15 12L15 22'],
  'check-square': ['M9 11L12 14L22 4', 'M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
  calendar: [
    'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M16 2L16 6',
    'M8 2L8 6',
    'M3 10L21 10',
  ],
  'clipboard-list': [
    'M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3',
    'M9 3h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
    'M9 12L15 12',
    'M9 16L13 16',
  ],
  settings: [
    'M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  ],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  sun: [
    'M7 12a5 5 0 1 0 10 0 5 5 0 1 0-10 0z',
    'M12 1L12 3M12 21L12 23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12L3 12M21 12L23 12M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22',
  ],
  'calendar-range': [
    'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M16 2L16 6',
    'M8 2L8 6',
    'M3 10L21 10',
    'M8 16L16 16',
  ],
  star: [
    'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z',
  ],
  sliders: [
    'M4 21L4 14M4 10L4 3M12 21L12 12M12 8L12 3M20 21L20 16M20 12L20 3M1 14L7 14M9 8L15 8M17 16L23 16',
  ],
  clock: ['M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0z', 'M12 6L12 12L16 14'],
  flag: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22L4 15'],
  'chevron-left': ['M15 18L9 12L15 6'],
  'chevron-right': ['M9 18L15 12L9 6'],
  'chevron-down': ['M6 9L12 15L18 9'],
  check: ['M20 6L9 17L4 12'],
  users: [
    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
    'M5 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0z',
    'M23 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2L14 8L20 8'],
  trash: ['M4 6h16M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6'],
  plus: ['M12 5L12 19M5 12L19 12'],
};
