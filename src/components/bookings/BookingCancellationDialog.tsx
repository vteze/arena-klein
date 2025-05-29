
"use client";

import { useState } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Booking } from '@/lib/types';
import { Loader2, AlertTriangle } from 'lucide-react';

interface BookingCancellationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
}

export function BookingCancellationDialog({
  isOpen,
  onOpenChange,
  booking,
}: BookingCancellationDialogProps) {
  const { cancelBooking } = useAuth();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleConfirmCancellation = async () => {
    setIsCancelling(true);
    try {
      await cancelBooking(booking.id);
      toast({
        title: "Reserva Cancelada",
        description: `Sua reserva para ${booking.courtName} em ${format(parseISO(booking.date), "dd/MM/yyyy", { locale: ptBR })} às ${booking.time} foi cancelada com sucesso.`,
        duration: 5000,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Falha ao cancelar reserva:", error);
      toast({
        variant: "destructive",
        title: "Falha ao Cancelar Reserva",
        description: error.message || "Não foi possível cancelar a reserva. Por favor, tente novamente.",
        duration: 7000,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isCancelling && onOpenChange(open)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
            Confirmar Cancelamento
          </DialogTitle>
          <DialogDescription className="pt-2">
            Você tem certeza que deseja cancelar a seguinte reserva? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        {/* Detalhes da reserva movidos para fora do DialogDescription */}
        <div className="mt-4 space-y-1 text-sm text-foreground bg-muted/50 p-3 rounded-md">
          <p><span className="font-medium">Quadra:</span> {booking.courtName} ({booking.courtType === 'covered' ? 'Coberta' : 'Descoberta'})</p>
          <p><span className="font-medium">Data:</span> {format(parseISO(booking.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          <p><span className="font-medium">Hora:</span> {booking.time}</p>
          <p className="text-xs"><span className="font-medium">ID da Reserva:</span> {booking.id}</p>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCancelling}>
            Manter Reserva
          </Button>
          <Button variant="destructive" onClick={handleConfirmCancellation} disabled={isCancelling}>
            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, Cancelar Reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
