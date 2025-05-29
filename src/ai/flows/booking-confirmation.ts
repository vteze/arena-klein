
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
Sua tarefa é gerar uma mensagem de confirmação de reserva amigável e clara.
Use os seguintes detalhes para a mensagem:
- Nome do Usuário: {{userName}}
- ID da Reserva: {{bookingId}}
- Tipo de Quadra: {{courtType}}
- Data: {{date}}
- Hora: {{time}}

Crie uma mensagem de confirmação que seja acolhedora. Inclua uma frase como "Estamos ansiosos para recebê-lo(a)!".
Assine a mensagem como "Atenciosamente, Arena Klein Beach Tennis".

IMPORTANTE: Após criar a mensagem de confirmação, sua resposta DEVE SER OBRIGATORIAMENTE um objeto JSON.
Este objeto JSON deve conter EXATAMENTE uma chave chamada "confirmationMessage".
O valor desta chave "confirmationMessage" deve ser a string completa da mensagem de confirmação que você gerou.

Exemplo da ESTRUTURA JSON DE SAÍDA OBRIGATÓRIA:
{
  "confirmationMessage": "Prezado(a) {{userName}}, sua reserva (ID: {{bookingId}}) para a {{courtType}} no dia {{date}} às {{time}} está confirmada. Estamos ansiosos para recebê-lo(a)! Atenciosamente, Arena Klein Beach Tennis"
}
Certifique-se de que a mensagem real seja adaptada aos detalhes fornecidos.
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
      let aiTextResponse = 'N/A';
      let detailedError = 'A resposta da IA estava vazia ou em formato incorreto (sem output estruturado).';
      try {
        aiTextResponse = response.text; // Acessa o texto bruto da IA
        detailedError = `A resposta da IA não pôde ser processada no formato esperado. Texto recebido (início): ${aiTextResponse.substring(0,150)}...`;
      } catch (e) {
        aiTextResponse = 'Erro ao tentar acessar response.text.';
        detailedError = 'Erro crítico ao tentar ler a resposta da IA.';
      }
      
      console.error(
        'Falha no Genkit prompt (bookingConfirmationPrompt): Não retornou um output estruturado válido.',
        'Input fornecido:', input,
        'Texto bruto da IA (response.text):', aiTextResponse,
        'Objeto de resposta completo da IA (response):', JSON.stringify(response) // Loga o objeto response completo
      );
      throw new Error(`Falha ao gerar a mensagem de confirmação pela IA. ${detailedError}`);
    }
    return response.output;
  }
);
