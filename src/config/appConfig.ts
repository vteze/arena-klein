
import type { Court } from '@/lib/types';

export const APP_NAME = "Arena Klein Beach Tennis";

export const courts: Court[] = [
  {
    id: 'covered-court',
    name: 'Quadra Coberta',
    type: 'covered',
    imageUrl: 'https://static.wixstatic.com/media/7b7a56_9c7444619c90469cae2ec8e84b89ac98~mv2.jpg/v1/fit/w_1280,h_960,al_c,q_85/7b7a56_9c7444619c90469cae2ec8e84b89ac98~mv2.jpg',
    description: 'Jogue confortavelmente independentemente do clima em nossa quadra coberta premium.',
    dataAiHint: 'beachtennis coberta',
  },
  {
    id: 'uncovered-court',
    name: 'Quadra Não-Coberta', // Nome alterado
    type: 'uncovered',
    imageUrl: 'https://manalinda.cdn.magazord.com.br/img/2024/02/blog/4491/beach-tennis.jpg',
    description: 'Aproveite o sol e o ar fresco em nossa espaçosa quadra não-coberta.', // Descrição atualizada
    dataAiHint: 'beachtennis nao-coberta', // Hint atualizado
  },
];

export const availableTimeSlots: string[] = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];
