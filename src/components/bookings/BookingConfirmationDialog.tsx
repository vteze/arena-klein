
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label'; 
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Court } from '@/lib/types';
import { personalizedBookingConfirmation, PersonalizedBookingConfirmationInput } from '@/ai/flows/booking-confirmation';
import { Loader2, CalendarDays, Clock, UserCircle, Mail, UserCog } from 'lucide-react';

interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  court: Court;
  selectedDate: Date;
  selectedTime: string;
}

export function BookingConfirmationDialog({
  isOpen,
  onOpenChange,
  court,
  selectedDate,
  selectedTime,
}: BookingConfirmationDialogProps) {
  const { currentUser, isAdmin, addBooking } = useAuth();
  const { toast } = useToast();
  const [isBooking, setIsBooking] = useState(false);
  const [onBehalfOfName, setOnBehalfOfName] = useState('');

  const handleBooking = async () => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "Você precisa estar logado para reservar uma quadra.",
      });
      onOpenChange(false); 
      return;
    }

    setIsBooking(true);
    let actualBookingId: string | null = null;

    try {
      const bookingDataForDb = {
        courtId: court.id,
        courtName: court.name,
        courtType: court.type,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
      };

      actualBookingId = await addBooking(
        bookingDataForDb,
        isAdmin && onBehalfOfName.trim() ? onBehalfOfName.trim() : undefined
      ); 

      // Feedback imediato de sucesso da reserva
      toast({
        title: "Reserva Confirmada!",
        description: `Sua ${court.name} em ${format(selectedDate, 'dd/MM/yyyy')} às ${selectedTime} foi agendada (ID: ${actualBookingId}).`,
        duration: 5000, 
      });

      onOpenChange(false); // Fecha o diálogo mais cedo

      // Processamento da IA e simulação de email em "background" (não bloqueia UI principal)
      // Não precisa mais do setIsBooking(false) aqui, pois o finally cuidará disso
      // e o diálogo já foi fechado.

      const nameForEmailSalutation = (isAdmin && onBehalfOfName.trim()) ? onBehalfOfName.trim() : currentUser.name;
      const emailRecipientDisplay = (isAdmin && onBehalfOfName.trim()) 
        ? `${onBehalfOfName.trim()} (contato via admin ${currentUser.email})` 
        : currentUser.email;

      const aiInput: PersonalizedBookingConfirmationInput = {
        userName: currentUser.name, 
        onBehalfOfName: isAdmin && onBehalfOfName.trim() ? onBehalfOfName.trim() : undefined,
        courtType: court.name, 
        date: bookingDataForDb.date,
        time: bookingDataForDb.time,
        bookingId: actualBookingId, 
      };
      
      let finalAiConfirmationMessage = `Reserva para ${court.name} em ${format(selectedDate, 'dd/MM/yyyy')} às ${selectedTime} confirmada!`; // Fallback
      let finalEmailSubject = `Confirmação da sua reserva na Arena Klein Beach Tennis (ID: ${actualBookingId})`;
      let finalEmailBody = `Prezado(a) ${nameForEmailSalutation},\n\nSua reserva (ID: ${actualBookingId}) para a ${court.name} no dia ${format(selectedDate, 'dd/MM/yyyy')} às ${selectedTime} está confirmada.\n\nInformações importantes:\n- Chegue com 10 minutos de antecedência.\n- Em caso de necessidade de cancelamento, acesse 'Minhas Reservas' em nosso site/app ou entre em contato com ${isAdmin && onBehalfOfName.trim() ? currentUser.name : 'a recepção'}.\n\nEstamos ansiosos para recebê-lo(a)!\n\nAtenciosamente,\nEquipe Arena Klein Beach Tennis`;

      try {
        const aiResponse = await personalizedBookingConfirmation(aiInput);
        finalAiConfirmationMessage = aiResponse.confirmationMessage;
        finalEmailSubject = aiResponse.emailSubject;
        finalEmailBody = aiResponse.emailBody;
        // Opcional: Um toast secundário se a mensagem da IA for muito valiosa e diferente
        // toast({ title: "Detalhes da Confirmação:", description: finalAiConfirmationMessage, duration: 7000});
      } catch (aiError: any) {
        console.warn("Falha ao gerar mensagem personalizada pela IA (a reserva principal foi bem-sucedida):", aiError.message);
        toast({
          variant: "default", 
          title: "Info: Confirmação Detalhada",
          description: "Sua reserva está confirmada. Houve um problema ao gerar a mensagem personalizada para o email (simulado).",
          duration: 7000,
        });
      }

      console.log("--- Simulação de Envio de Email (Após Reserva e Fechamento do Diálogo) ---");
      console.log("Para (Conteúdo do Email Destinado a):", nameForEmailSalutation);
      console.log("Email Registrado/Admin (Para onde seria enviado):", emailRecipientDisplay);
      console.log("Assunto:", finalEmailSubject);
      console.log("Corpo do Email:\n", finalEmailBody);
      console.log("------------------------------------");
      
      // Limpa o nome "em nome de" apenas se o booking foi bem sucedido e o diálogo fechado
      if (actualBookingId) { // Implica sucesso na reserva
        setOnBehalfOfName('');
      }

    } catch (error: any) {
      console.error("Falha na reserva (pega no BookingConfirmationDialog):", error);
      toast({
        variant: "destructive",
        title: "Falha na Reserva",
        description: error?.message || "Ocorreu um erro ao tentar processar a reserva. Por favor, tente novamente.",
        duration: 9000,
      });
       // Não fechar o diálogo em caso de erro na reserva principal
    } finally {
      setIsBooking(false); // Garante que o spinner pare, independentemente do resultado
    }
  };

  useEffect(() => {
    // Resetar o nome "em nome de" apenas se o diálogo for fechado pelo usuário
    // ou após uma operação bem-sucedida.
    // A lógica de reset após sucesso já está no try/finally do handleBooking.
    if (!isOpen) {
      setOnBehalfOfName('');
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isBooking) { // Permite fechar o diálogo apenas se não estiver em processo de booking
        onOpenChange(open);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Sua Reserva</DialogTitle>
          <DialogDescription>
            Você está prestes a reservar a <span className="font-semibold text-primary">{court.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="onBehalfOfName" className="flex items-center gap-1 text-sm">
                <UserCog className="h-4 w-4 text-muted-foreground" />
                Reservar em nome de (opcional):
              </Label>
              <Input
                id="onBehalfOfName"
                value={onBehalfOfName}
                onChange={(e) => setOnBehalfOfName(e.target.value)}
                placeholder="Nome do cliente"
                disabled={isBooking}
              />
              <p className="text-xs text-muted-foreground">
                Se preenchido, a reserva será para esta pessoa, mas registrada em seu nome (admin). O email de confirmação (simulado) será direcionado ao cliente.
              </p>
            </div>
          )}
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">Data:</span> {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">Horário:</span> {selectedTime}
            </span>
          </div>
          {currentUser && ! (isAdmin && onBehalfOfName.trim()) && ( 
            <div className="flex items-center">
               <UserCircle className="mr-2 h-5 w-5 text-muted-foreground" />
               <span className="text-sm"><span className="font-medium">Reservado por:</span> {currentUser.name}</span>
            </div>
          )}
           {currentUser && (
            <div className="flex items-center text-xs text-muted-foreground/80 pt-1">
              <Mail className="mr-2 h-4 w-4" />
              <span>Um email de confirmação seria enviado para: {
                (isAdmin && onBehalfOfName.trim()) ? `${onBehalfOfName.trim()} (com cópia para admin ${currentUser.email})` : currentUser.email
              }</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false);}} disabled={isBooking}>
            Cancelar
          </Button>
          <Button onClick={handleBooking} disabled={isBooking} className="bg-accent hover:bg-accent/90">
            {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
