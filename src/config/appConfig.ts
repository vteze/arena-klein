
import type { Court } from '@/lib/types';

export const APP_NAME = "Arena Klein Beach Tennis";

export const courts: Court[] = [
  {
    id: 'covered-court',
    name: 'Covered Court',
    type: 'covered',
    imageUrl: 'https://placehold.co/600x400.png',
    description: 'Play comfortably regardless of the weather on our premium covered court.',
    dataAiHint: 'beach covered',
  },
  {
    id: 'uncovered-court',
    name: 'Uncovered Court',
    type: 'uncovered',
    imageUrl: 'https://placehold.co/600x400.png',
    description: 'Enjoy the sunshine and fresh air on our spacious uncovered court.',
    dataAiHint: 'beach sun',
  },
];

export const availableTimeSlots: string[] = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];
