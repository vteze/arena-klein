
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
  courtType: z.string().describe('O tipo de quadra reservada (ex: Quadra Coberta).'),
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
  prompt: `
Você é um assistente da Arena Klein Beach Tennis.
Sua tarefa é gerar uma mensagem de confirmação de reserva amigável.
Use os seguintes detalhes para a mensagem:
- Nome do Usuário: {{userName}}
- ID da Reserva: {{bookingId}}
- Tipo de Quadra: {{courtType}}
- Data: {{date}}
- Hora: {{time}}

A mensagem deve confirmar claramente a reserva e incluir uma frase amigável, como "Estamos ansiosos para recebê-lo(a)!".
Assine a mensagem como "Atenciosamente, Arena Klein Beach Tennis".

Importante: Sua resposta DEVE ser um objeto JSON que corresponda ao schema de saída, que espera uma única chave "confirmationMessage" contendo a string da mensagem de confirmação gerada.

Exemplo de formato JSON de saída esperado:
{
  "confirmationMessage": "Prezado(a) {{userName}}, Confirmamos sua reserva com o ID {{bookingId}} para a quadra {{courtType}} no dia {{date}} às {{time}}. Estamos ansiosos para recebê-lo(a)! Atenciosamente, Arena Klein Beach Tennis"
}
Adapte a mensagem para soar natural e amigável com base nos detalhes fornecidos.
`,
});

const personalizedBookingConfirmationFlow = ai.defineFlow(
  {
    name: 'personalizedBookingConfirmationFlow',
    inputSchema: PersonalizedBookingConfirmationInputSchema,
    outputSchema: PersonalizedBookingConfirmationOutputSchema,
  },
  async input => {
    const response = await bookingConfirmationPrompt(input);
    if (!response.output) {
      console.error('Genkit prompt (bookingConfirmationPrompt) did not return an output.', 'Input:', input, 'Full response:', response);
      throw new Error('Falha ao gerar a mensagem de confirmação pela IA. A resposta da IA estava vazia.');
    }
    return response.output;
  }
);

