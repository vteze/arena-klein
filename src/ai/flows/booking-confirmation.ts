
// Booking Confirmation Flow
'use server';

/**
 * @fileOverview Este arquivo define um fluxo Genkit para gerar mensagens personalizadas de confirmação de reserva.
 *
 * - personalizedBookingConfirmation - Uma função que gera uma mensagem personalizada de confirmação de reserva.
 * - PersonalizedBookingConfirmationInput - O tipo de entrada para a função personalizedBookingConfirmation.
 * - PersonalizedBookingConfirmationOutput - O tipo de retorno para a função personalizedBookingConfirmation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedBookingConfirmationInputSchema = z.object({
  userName: z.string().describe('O nome do usuário que fez a reserva.'),
  courtType: z.string().describe('O tipo de quadra reservada (ex: coberta, descoberta).'),
  date: z.string().describe('A data da reserva (AAAA-MM-DD).'),
  time: z.string().describe('A hora da reserva (HH:mm).'),
  bookingId: z.string().describe('O identificador único da reserva.'),
});
export type PersonalizedBookingConfirmationInput = z.infer<typeof PersonalizedBookingConfirmationInputSchema>;

const PersonalizedBookingConfirmationOutputSchema = z.object({
  confirmationMessage: z.string().describe('Uma mensagem personalizada de confirmação de reserva.'),
});
export type PersonalizedBookingConfirmationOutput = z.infer<typeof PersonalizedBookingConfirmationOutputSchema>;

export async function personalizedBookingConfirmation(
  input: PersonalizedBookingConfirmationInput
): Promise<PersonalizedBookingConfirmationOutput> {
  return personalizedBookingConfirmationFlow(input);
}

const bookingConfirmationPrompt = ai.definePrompt({
  name: 'bookingConfirmationPrompt',
  input: {schema: PersonalizedBookingConfirmationInputSchema},
  output: {schema: PersonalizedBookingConfirmationOutputSchema},
  prompt: `Prezado(a) {{userName}},

Confirmamos sua reserva com o ID {{bookingId}} para a quadra {{courtType}} no dia {{date}} às {{time}}. Estamos ansiosos para recebê-lo(a)!

Atenciosamente,
Arena Klein Beach Tennis`,
});

const personalizedBookingConfirmationFlow = ai.defineFlow(
  {
    name: 'personalizedBookingConfirmationFlow',
    inputSchema: PersonalizedBookingConfirmationInputSchema,
    outputSchema: PersonalizedBookingConfirmationOutputSchema,
  },
  async input => {
    const {output} = await bookingConfirmationPrompt(input);
    return output!;
  }
);
