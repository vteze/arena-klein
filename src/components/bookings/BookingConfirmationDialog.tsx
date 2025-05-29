
"use client";

import { useState } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Court, Booking } from '@/lib/types';
import { personalizedBookingConfirmation, PersonalizedBookingConfirmationInput } from '@/ai/flows/booking-confirmation';
import { Loader2, CalendarDays, Clock, UserCircle, Mail } from 'lucide-react';

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
  const { currentUser, addBooking } = useAuth();
  const { toast } = useToast();
  const [isBooking, setIsBooking] = useState(false);

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
    try {
      const bookingDataForDb: Omit<Booking, 'id' | 'userId' | 'userName'> = {
        courtId: court.id,
        courtName: court.name,
        courtType: court.type,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
      };

      const actualBookingId = await addBooking(bookingDataForDb); 

      const aiInput: PersonalizedBookingConfirmationInput = {
        userName: currentUser.name,
        courtType: court.name, // This is court.name, e.g. "Quadra Coberta"
        date: bookingDataForDb.date,
        time: bookingDataForDb.time,
        bookingId: actualBookingId, 
      };
      
      let confirmationMessage = `Reserva para ${court.name} em ${format(selectedDate, 'dd/MM/yyyy')} às ${selectedTime} confirmada!`;
      let emailSubject = `Confirmação da sua reserva na Arena Klein Beach Tennis (ID: ${actualBookingId})`;
      let emailBody = `Prezado(a) ${currentUser.name},\n\nSua reserva (ID: ${actualBookingId}) para a ${court.name} no dia ${format(selectedDate, 'dd/MM/yyyy')} às ${selectedTime} está confirmada.\n\nPor favor, chegue com 10 minutos de antecedência.\nEm caso de necessidade de cancelamento, acesse 'Minhas Reservas' em nosso site ou app.\n\nEstamos ansiosos para recebê-lo(a)!\n\nAtenciosamente,\nEquipe Arena Klein Beach Tennis`;

      try {
        const aiResponse = await personalizedBookingConfirmation(aiInput);
        confirmationMessage = aiResponse.confirmationMessage;
        emailSubject = aiResponse.emailSubject;
        emailBody = aiResponse.emailBody;
      } catch (aiError: any) {
        console.warn("Falha ao gerar mensagem personalizada pela IA, usando fallback:", aiError.message);
        // Usar mensagens de fallback já definidas acima.
        // Poderia adicionar um toast específico para a falha da IA, se desejado.
      }


      toast({
        title: "Reserva Confirmada!",
        description: `${confirmationMessage} (Um email de confirmação também seria enviado).`,
        duration: 7000, 
      });

      console.log("--- Simulação de Envio de Email ---");
      console.log("Para:", currentUser.email);
      console.log("Assunto:", emailSubject);
      console.log("Corpo do Email:\n", emailBody);
      console.log("------------------------------------");

      onOpenChange(false);
    } catch (error: any) {
      console.error("Falha na reserva (pega no BookingConfirmationDialog):", error);
      toast({
        variant: "destructive",
        title: "Falha na Reserva",
        description: error?.message || "Ocorreu um erro ao tentar processar a confirmação da reserva. Por favor, tente novamente.",
        duration: 9000,
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isBooking && onOpenChange(open)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Sua Reserva</DialogTitle>
          <DialogDescription>
            Você está prestes a reservar a <span className="font-semibold text-primary">{court.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
          {currentUser && (
            <div className="flex items-center">
               <UserCircle className="mr-2 h-5 w-5 text-muted-foreground" />
               <span className="text-sm"><span className="font-medium">Reservado por:</span> {currentUser.name}</span>
            </div>
          )}
           {currentUser && (
            <div className="flex items-center text-xs text-muted-foreground/80 pt-1">
              <Mail className="mr-2 h-4 w-4" />
              <span>Um email de confirmação seria enviado para: {currentUser.email}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBooking}>
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
