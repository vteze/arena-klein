
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Court, TimeSlot } from '@/lib/types';
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
  currentSelectedDate?: Date; // Changed from selectedDate
  onDateSelect: (date?: Date) => void; // New prop to handle date selection
}

export function AvailabilityCalendar({
  court,
  className,
  currentSelectedDate,
  onDateSelect,
}: AvailabilityCalendarProps) {
  // Local state for time slots and dialog management, selectedDate is now a prop
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  const { currentUser, bookings, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentSelectedDate && !authIsLoading) {
      const formattedSelectedDate = format(currentSelectedDate, 'yyyy-MM-dd');
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
    } else {
      setTimeSlots([]); // Clear time slots if no date is selected
    }
  }, [currentSelectedDate, court.id, bookings, authIsLoading]);

  const handleTimeSlotClick = (time: string) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!currentSelectedDate) { // Should not happen if button is enabled, but good check
        toast({
            title: "Erro",
            description: "Por favor, selecione uma data primeiro.",
            variant: "destructive"
        })
        return;
    }
    setSelectedTimeSlot(time);
    setIsDialogOpen(true);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today to the start of the day for comparison

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-xl">Verificar Disponibilidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <Calendar
              mode="single"
              selected={currentSelectedDate}
              onSelect={onDateSelect} // Use the passed-in handler
              className="rounded-md border shadow-sm"
              disabled={(date) => date < today}
              locale={ptBR}
            />
          </div>
          <div className="flex-grow">
            {currentSelectedDate ? (
              <>
                <h3 className="text-lg font-semibold mb-3 text-center md:text-left">
                  Horários Disponíveis para {format(currentSelectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}:
                </h3>
                {authIsLoading ? (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableTimeSlots.map(slot => (
                      <Button key={slot} variant="outline" disabled className="animate-pulse h-10 bg-muted"></Button>
                    ))}
                  </div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
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
                  <p className="text-muted-foreground text-center md:text-left">Nenhum horário configurado para esta data ou quadra.</p>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Selecione uma Data</AlertTitle>
                <AlertDescription>
                  Por favor, escolha uma data no calendário para ver os horários disponíveis para esta quadra.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
      {currentSelectedDate && selectedTimeSlot && (
        <BookingConfirmationDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          court={court}
          selectedDate={currentSelectedDate} // Pass the globally selected date
          selectedTime={selectedTimeSlot}
        />
      )}
    </Card>
  );
}

// Minimal toast for internal use if needed, ensure useToast is imported if used more broadly
import { toast } from "@/hooks/use-toast";
