
"use client";

import { useState } from 'react';
import type { Booking } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, ShieldCheck, Sun, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookingCancellationDialog } from './BookingCancellationDialog';

interface BookingListItemProps {
  booking: Booking;
}

export function BookingListItem({ booking }: BookingListItemProps) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const bookingDate = parseISO(booking.date);

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between">
        <div>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              {booking.courtType === 'covered' ? 
                <ShieldCheck className="mr-2 h-6 w-6 text-primary" /> : 
                <Sun className="mr-2 h-6 w-6 text-primary" />
              }
              {booking.courtName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{format(bookingDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{booking.time}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">ID da Reserva: {booking.id}</p>
          </CardContent>
        </div>
        <CardFooter className="pt-4 flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsCancelDialogOpen(true)}
            aria-label={`Cancelar reserva para ${booking.courtName} em ${format(bookingDate, "dd/MM/yyyy")} às ${booking.time}`}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </CardFooter>
      </Card>
      {isCancelDialogOpen && (
        <BookingCancellationDialog
          isOpen={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          booking={booking}
        />
      )}
    </>
  );
}
