
"use client";

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
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
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Adicionado Input
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types';
import { availableTimeSlots } from '@/config/appConfig';
import { Loader2, CalendarIcon, ClockIcon, UserCircle } from 'lucide-react'; // Adicionado UserCircle
import { cn } from '@/lib/utils';

interface EditBookingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  onBookingUpdated: () => void; 
}

export function EditBookingDialog({
  isOpen,
  onOpenChange,
  booking,
  onBookingUpdated,
}: EditBookingDialogProps) {
  const { updateBookingByAdmin, bookings: allBookings } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(parseISO(booking.date));
  const [selectedTime, setSelectedTime] = useState<string>(booking.time);
  const [onBehalfOfName, setOnBehalfOfName] = useState<string>(booking.onBehalfOf || '');
  const [availableSlotsForSelectedDate, setAvailableSlotsForSelectedDate] = useState<string[]>([]);

  useEffect(() => {
    if (selectedDate) {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const occupiedSlots = allBookings
            .filter(b => b.courtId === booking.courtId && b.date === formattedDate && b.id !== booking.id)
            .map(b => b.time);
        
        setAvailableSlotsForSelectedDate(
            availableTimeSlots.filter(slot => !occupiedSlots.includes(slot))
        );
    } else {
        setAvailableSlotsForSelectedDate(availableTimeSlots);
    }
  }, [selectedDate, allBookings, booking.courtId, booking.id]);

  useEffect(() => {
    // Reset form fields when the dialog is reopened with a different booking
    if (isOpen) {
      setSelectedDate(parseISO(booking.date));
      setSelectedTime(booking.time);
      setOnBehalfOfName(booking.onBehalfOf || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, booking]);


  const handleConfirmUpdate = async () => {
    if (!selectedDate) {
      toast({ variant: "destructive", title: "Erro", description: "Por favor, selecione uma nova data." });
      return;
    }
    if (!selectedTime) {
      toast({ variant: "destructive", title: "Erro", description: "Por favor, selecione um novo horário." });
      return;
    }

    const formattedNewDate = format(selectedDate, 'yyyy-MM-dd');
    const trimmedOnBehalfOfName = onBehalfOfName.trim();

    const initialOnBehalfOf = booking.onBehalfOf || '';

    if (
        formattedNewDate === booking.date &&
        selectedTime === booking.time &&
        trimmedOnBehalfOfName === initialOnBehalfOf
      ) {
        toast({ title: "Nenhuma Alteração", description: "Os dados selecionados são os mesmos da reserva atual." });
        onOpenChange(false);
        return;
    }

    setIsUpdating(true);
    try {
      await updateBookingByAdmin(booking.id, formattedNewDate, selectedTime, trimmedOnBehalfOfName);
      toast({
        title: "Reserva Atualizada",
        description: `A reserva foi atualizada com sucesso.`,
        duration: 5000,
      });
      onBookingUpdated(); 
      onOpenChange(false);
    } catch (error: any) {
      console.error("Falha ao atualizar reserva (admin):", error);
      toast({
        variant: "destructive",
        title: "Falha ao Atualizar Reserva",
        description: error.message || "Não foi possível atualizar a reserva. Verifique se o novo horário está disponível.",
        duration: 7000,
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const today = new Date();
  today.setHours(0,0,0,0);

  const hasChanges = format(selectedDate || new Date(0), 'yyyy-MM-dd') !== booking.date ||
                     selectedTime !== booking.time ||
                     (onBehalfOfName.trim() || undefined) !== (booking.onBehalfOf || undefined);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isUpdating && onOpenChange(open)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-6 w-6 text-primary" />
            Editar Reserva (Admin)
          </DialogTitle>
          <DialogDescription className="pt-2">
            Modifique os dados da reserva de <span className="font-semibold">{booking.onBehalfOf || booking.userName}</span> na quadra <span className="font-semibold">{booking.courtName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div>
            <Label htmlFor="edit-on-behalf-of" className="text-sm font-medium text-foreground mb-2 block flex items-center">
              <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
              Em nome de (cliente):
            </Label>
            <Input
              id="edit-on-behalf-of"
              value={onBehalfOfName}
              onChange={(e) => setOnBehalfOfName(e.target.value)}
              placeholder="Nome do cliente (deixe vazio se for do usuário)"
              disabled={isUpdating}
            />
             <p className="text-xs text-muted-foreground mt-1">Originalmente reservado por: {booking.userName}</p>
          </div>
          <div>
            <Label htmlFor="edit-date" className="text-sm font-medium text-foreground mb-2 block flex items-center">
             <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              Nova Data:
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border shadow-sm p-0 mx-auto"
              disabled={(date) => date < today}
              locale={ptBR}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block flex items-center">
              <ClockIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              Novo Horário:
            </Label>
            {selectedDate ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimeSlots.map((slot) => {
                    const isCurrentlyBookedByOther = allBookings.some(b => 
                        b.courtId === booking.courtId &&
                        b.date === format(selectedDate, 'yyyy-MM-dd') &&
                        b.time === slot &&
                        b.id !== booking.id 
                    );

                    return (
                    <Button
                        key={slot}
                        variant={selectedTime === slot ? "default" : (isCurrentlyBookedByOther ? "destructive" : "outline")}
                        onClick={() => !isCurrentlyBookedByOther && setSelectedTime(slot)}
                        disabled={isCurrentlyBookedByOther}
                        className={cn("w-full transition-all", 
                            selectedTime === slot && "ring-2 ring-primary ring-offset-2",
                            isCurrentlyBookedByOther && "cursor-not-allowed line-through"
                        )}
                        aria-label={isCurrentlyBookedByOther ? `Horário ${slot} indisponível` : `Selecionar ${slot}`}
                    >
                        {slot}
                    </Button>
                    );
                })}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Selecione uma data para ver os horários.</p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmUpdate} 
            disabled={isUpdating || !selectedDate || !selectedTime || !hasChanges}
            className="bg-accent hover:bg-accent/90"
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Mudanças
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
