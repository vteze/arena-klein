
import type { Court } from '@/lib/types';

export const APP_NAME = "Arena Klein Beach Tennis";

export const courts: Court[] = [
  {
    id: 'covered-court',
    name: 'Quadra Coberta',
    type: 'covered',
    imageUrl: 'https://placehold.co/600x400/E0E0E0/E0E0E0.png', // Updated to hide default text
    description: 'Jogue confortavelmente independentemente do clima em nossa quadra coberta premium.',
    dataAiHint: 'praia coberta',
  },
  {
    id: 'uncovered-court',
    name: 'Quadra Descoberta',
    type: 'uncovered',
    imageUrl: 'https://placehold.co/600x400/E0E0E0/E0E0E0.png', // Updated to hide default text
    description: 'Aproveite o sol e o ar fresco em nossa espaçosa quadra descoberta.',
    dataAiHint: 'praia sol',
  },
];

export const availableTimeSlots: string[] = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];
