
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
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types';
import { availableTimeSlots } from '@/config/appConfig';
import { Loader2, AlertTriangle, CalendarIcon, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditBookingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  onBookingUpdated: () => void; // Callback after successful update
}

export function EditBookingDialog({
  isOpen,
  onOpenChange,
  booking,
  onBookingUpdated,
}: EditBookingDialogProps) {
  const { updateBookingByAdmin, bookings: allBookings } = useAuth(); // Assuming updateBookingByAdmin expects (id, newDate, newTime)
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(parseISO(booking.date));
  const [selectedTime, setSelectedTime] = useState<string>(booking.time);
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
        setAvailableSlotsForSelectedDate(availableTimeSlots); // Show all if no date selected (though date is required)
    }
  }, [selectedDate, allBookings, booking.courtId, booking.id]);


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

    // Check if the new slot is the same as the old slot
    if (formattedNewDate === booking.date && selectedTime === booking.time) {
        toast({ title: "Nenhuma Alteração", description: "A data e o horário selecionados são os mesmos da reserva atual." });
        onOpenChange(false);
        return;
    }

    setIsUpdating(true);
    try {
      await updateBookingByAdmin(booking.id, formattedNewDate, selectedTime);
      toast({
        title: "Reserva Atualizada",
        description: `A reserva foi atualizada para ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às ${selectedTime}.`,
        duration: 5000,
      });
      onBookingUpdated(); // Notify parent
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isUpdating && onOpenChange(open)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-6 w-6 text-primary" />
            Editar Reserva (Admin)
          </DialogTitle>
          <DialogDescription className="pt-2">
            Modifique a data e/ou horário para a reserva de <span className="font-semibold">{booking.userName}</span> na quadra <span className="font-semibold">{booking.courtName}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div>
            <Label htmlFor="edit-date" className="text-sm font-medium text-foreground mb-2 block">
              Nova Data
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border shadow-sm p-0 mx-auto"
              disabled={(date) => date < today}
              locale={ptBR}
              initialFocus
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Novo Horário
            </Label>
            {selectedDate ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimeSlots.map((slot) => {
                    const isCurrentlyBookedByOther = allBookings.some(b => 
                        b.courtId === booking.courtId &&
                        b.date === format(selectedDate, 'yyyy-MM-dd') &&
                        b.time === slot &&
                        b.id !== booking.id // Exclude the current booking being edited
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
            disabled={isUpdating || !selectedDate || !selectedTime || (format(selectedDate, 'yyyy-MM-dd') === booking.date && selectedTime === booking.time)}
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
