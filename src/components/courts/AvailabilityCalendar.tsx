
"use client";

import { useState, useEffect } from 'react';
import { format, parse, isEqual, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Court, TimeSlot, Booking } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { availableTimeSlots } from '@/config/appConfig';
import { BookingConfirmationDialog } from '@/components/bookings/BookingConfirmationDialog';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
  court: Court;
  className?: string;
}

export function AvailabilityCalendar({ court, className }: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  const { currentUser, bookings, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (selectedDate && !authIsLoading) {
      const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
      const slots = availableTimeSlots.map(slotTime => {
        const isBooked = bookings.some(
          booking =>
            booking.courtId === court.id &&
            booking.date === formattedSelectedDate &&
            booking.time === slotTime
        );
        return { time: slotTime, isBooked };
      });
      setTimeSlots(slots);
    }
  }, [selectedDate, court.id, bookings, authIsLoading]);

  const handleTimeSlotClick = (time: string) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setSelectedTimeSlot(time);
    setIsDialogOpen(true);
  };

  const today = startOfDay(new Date());

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-xl">Verificar Disponibilidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 mx-auto md:mx-0"> {/* Center calendar on small screens */}
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border shadow-sm"
              disabled={(date) => date < today}
              locale={ptBR}
            />
          </div>
          <div className="flex-grow">
            {selectedDate ? (
              <>
                <h3 className="text-lg font-semibold mb-3 text-center md:text-left"> {/* Center title on small screens */}
                  Horários Disponíveis para {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}:
                </h3>
                {authIsLoading ? (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableTimeSlots.map(slot => (
                      <Button key={slot} variant="outline" disabled className="animate-pulse h-10 bg-muted"></Button>
                    ))}
                  </div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"> {/* Adjusted grid for consistency */}
                    {timeSlots.map(slot => (
                      <Button
                        key={slot.time}
                        variant={slot.isBooked ? "destructive" : "outline"}
                        disabled={slot.isBooked}
                        onClick={() => !slot.isBooked && handleTimeSlotClick(slot.time)}
                        className={cn(
                          "w-full transition-colors duration-150 ease-in-out",
                          slot.isBooked 
                            ? 'cursor-not-allowed opacity-70' 
                            : 'hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground'
                        )}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center md:text-left">Nenhum horário configurado.</p>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Selecione uma Data</AlertTitle>
                <AlertDescription>
                  Por favor, escolha uma data no calendário para ver os horários disponíveis.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
      {selectedDate && selectedTimeSlot && (
        <BookingConfirmationDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          court={court}
          selectedDate={selectedDate}
          selectedTime={selectedTimeSlot}
        />
      )}
    </Card>
  );
}
