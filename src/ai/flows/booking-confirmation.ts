
// Booking Confirmation Flow
'use server';

/**
 * @fileOverview Este arquivo define um fluxo Genkit para gerar mensagens personalizadas de confirmação de reserva,
 * incluindo conteúdo para um email de confirmação.
 *
 * - personalizedBookingConfirmation - Uma função que gera uma mensagem personalizada e conteúdo de email.
 * - PersonalizedBookingConfirmationInput - O tipo de entrada para a função.
 * - PersonalizedBookingConfirmationOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const PersonalizedBookingConfirmationInputSchema = z.object({
  userName: z.string().describe('O nome do usuário que efetivamente fez a reserva (ex: o admin).'),
  onBehalfOfName: z.string().optional().describe('O nome do cliente para quem a reserva foi feita, se aplicável (reservado por admin).'),
  courtType: z.string().describe('O tipo de quadra reservada (ex: Quadra Coberta).'),
  date: z.string().describe('A data da reserva (AAAA-MM-DD).'),
  time: z.string().describe('A hora da reserva (HH:mm).'),
  bookingId: z.string().describe('O identificador único da reserva.'),
});
export type PersonalizedBookingConfirmationInput = z.infer<typeof PersonalizedBookingConfirmationInputSchema>;

const PersonalizedBookingConfirmationOutputSchema = z.object({
  confirmationMessage: z.string().describe('Uma mensagem curta e amigável para o toast de confirmação de reserva.'),
  emailSubject: z.string().describe('O assunto do email de confirmação da reserva.'),
  emailBody: z.string().describe('O corpo completo (texto simples ou HTML básico) do email de confirmação da reserva, incluindo todos os detalhes.'),
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
Sua tarefa é gerar:
1. Uma mensagem CURTA e AMIGÁVEL de confirmação de reserva para ser exibida em um toast.
2. O ASSUNTO para um email de confirmação.
3. O CORPO DETALHADO para um email de confirmação.

Use os seguintes detalhes para a mensagem e o email:
- Nome do Cliente Principal: {{#if onBehalfOfName}}{{onBehalfOfName}}{{else}}{{userName}}{{/if}}
- Reservado por (se aplicável): {{#if onBehalfOfName}}{{userName}} (em nome de {{onBehalfOfName}}){{else}}{{userName}}{{/if}}
- ID da Reserva: {{bookingId}}
- Tipo de Quadra: {{courtType}}
- Data: {{date}}
- Hora: {{time}}

Para a mensagem CURTA (confirmationMessage):
Se 'onBehalfOfName' existir: "Reserva para {{onBehalfOfName}} (feita por {{userName}}) confirmada! {{courtType}} para {{date}} às {{time}} está garantida."
Senão: "Reserva confirmada, {{userName}}! Sua {{courtType}} para {{date}} às {{time}} está garantida."

Para o ASSUNTO do email (emailSubject):
Se 'onBehalfOfName' existir: "Confirmação da sua reserva (para {{onBehalfOfName}}) na Arena Klein Beach Tennis (ID: {{bookingId}})"
Senão: "Confirmação da sua reserva na Arena Klein Beach Tennis (ID: {{bookingId}})"

Para o CORPO do email (emailBody):
- Comece com uma saudação (Prezado(a) {{#if onBehalfOfName}}{{onBehalfOfName}}{{else}}{{userName}}{{/if}},).
- Confirme os detalhes da reserva de forma clara (Quadra, Data, Hora, ID da Reserva).
- Se 'onBehalfOfName' existir, adicione uma linha: "Esta reserva foi feita por {{userName}} em seu nome."
- Inclua uma frase como "Estamos ansiosos para recebê-lo(a)!".
- Adicione informações úteis, como "Chegue com 10 minutos de antecedência." e "Em caso de necessidade de cancelamento, acesse 'Minhas Reservas' em nosso site ou app (se a reserva foi feita por você) ou entre em contato com {{userName}} (se a reserva foi feita em seu nome).".
- Termine com "Atenciosamente, Equipe Arena Klein Beach Tennis".
- Formate o corpo do email para ser legível (pode ser texto simples, com quebras de linha).

IMPORTANTE: Sua resposta DEVE SER OBRIGATORIAMENTE um objeto JSON.
Este objeto JSON deve conter EXATAMENTE três chaves: "confirmationMessage", "emailSubject", e "emailBody".
Os valores destas chaves devem ser as strings que você gerou.

Exemplo da ESTRUTURA JSON DE SAÍDA OBRIGATÓRIA (adaptar o conteúdo real):
{
  "confirmationMessage": "Reserva confirmada!",
  "emailSubject": "Sua reserva na Arena Klein está confirmada!",
  "emailBody": "Prezado(a) Cliente,\\n\\nSua reserva está confirmada..."
}
Certifique-se de que o conteúdo real seja adaptado aos detalhes fornecidos. Use \\n para quebras de linha no emailBody se estiver gerando texto simples.
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
    if (!response.output || !response.output.confirmationMessage || !response.output.emailSubject || !response.output.emailBody) {
      let aiTextResponse = 'N/A';
      let detailedError = 'A resposta da IA estava vazia, incompleta ou em formato incorreto (sem output estruturado esperado).';
      try {
        aiTextResponse = response.text || JSON.stringify(response.output); // Acessa o texto bruto ou o output parcial
        detailedError = `A resposta da IA não pôde ser processada no formato esperado. Resposta recebida (início): ${aiTextResponse.substring(0,150)}...`;
      } catch (e) {
        // Se response.text e response.output falharem, mantenha o erro genérico.
        aiTextResponse = 'Erro ao tentar acessar response.text ou response.output.';
        detailedError = 'Erro crítico ao tentar ler a resposta da IA.';
      }
      
      console.error(
        'Falha no Genkit prompt (bookingConfirmationPrompt): Não retornou um output estruturado válido com todos os campos esperados.',
        'Input fornecido para a IA:', input,
        'Texto/Output bruto da IA:', aiTextResponse,
        'Objeto de resposta completo da IA (response):', JSON.stringify(response) // Log do objeto completo
      );
      throw new Error(`Falha ao gerar a mensagem e email de confirmação pela IA. ${detailedError}`);
    }
    return response.output;
  }
);
