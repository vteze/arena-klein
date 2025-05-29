
import type { Booking } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Clock, ShieldCheck, Sun } from 'lucide-react'; // ShieldCheck can represent covered
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BookingListItemProps {
  booking: Booking;
}

export function BookingListItem({ booking }: BookingListItemProps) {
  const bookingDate = parseISO(booking.date); // Assuming date is stored as YYYY-MM-DD

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
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
    </Card>
  );
}
