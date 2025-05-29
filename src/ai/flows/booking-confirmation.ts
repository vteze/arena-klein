// Booking Confirmation Flow
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized booking confirmation messages.
 *
 * - personalizedBookingConfirmation - A function that generates a personalized booking confirmation message.
 * - PersonalizedBookingConfirmationInput - The input type for the personalizedBookingConfirmation function.
 * - PersonalizedBookingConfirmationOutput - The return type for the personalizedBookingConfirmation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedBookingConfirmationInputSchema = z.object({
  userName: z.string().describe('The name of the user who made the booking.'),
  courtType: z.string().describe('The type of court booked (e.g., covered, uncovered).'),
  date: z.string().describe('The date of the booking (YYYY-MM-DD).'),
  time: z.string().describe('The time of the booking (HH:mm).'),
  bookingId: z.string().describe('The unique identifier for the booking.'),
});
export type PersonalizedBookingConfirmationInput = z.infer<typeof PersonalizedBookingConfirmationInputSchema>;

const PersonalizedBookingConfirmationOutputSchema = z.object({
  confirmationMessage: z.string().describe('A personalized booking confirmation message.'),
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
  prompt: `Dear {{userName}},

This confirms your booking with booking ID {{bookingId}} for the {{courtType}} court on {{date}} at {{time}}. We look forward to seeing you!

Sincerely,
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
