
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Court, TimeSlot, PlaySlotConfig } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { availableTimeSlots, playSlotsConfig } from '@/config/appConfig';
import { BookingConfirmationDialog } from '@/components/bookings/BookingConfirmationDialog';
import { AlertCircle, Swords } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from "@/hooks/use-toast";

interface AvailabilityCalendarProps {
  court: Court;
  className?: string;
  currentSelectedDate?: Date;
  onDateSelect: (date?: Date) => void;
}

// Helper function to check if a given time is within a "Play" session
function isTimeInPlaySession(date: Date, slotStartTime: string, playConfig: PlaySlotConfig[]): boolean {
  const dayOfWeek = date.getDay(); // 0 for Sunday, ..., 6 for Saturday

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const slotStartMinutes = timeToMinutes(slotStartTime);

  for (const playSlot of playConfig) {
    if (playSlot.dayOfWeek === dayOfWeek) {
      const [rangeStart, rangeEnd] = playSlot.timeRange.split(' - ');
      const rangeStartMinutes = timeToMinutes(rangeStart);
      const rangeEndMinutes = timeToMinutes(rangeEnd);

      // A slot is part of "Play" if its start time is within the Play range [start, end)
      if (slotStartMinutes >= rangeStartMinutes && slotStartMinutes < rangeEndMinutes) {
        return true;
      }
    }
  }
  return false;
}

export function AvailabilityCalendar({
  court,
  className,
  currentSelectedDate,
  onDateSelect,
}: AvailabilityCalendarProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  const { currentUser, bookings, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentSelectedDate && !authIsLoading) {
      const formattedSelectedDate = format(currentSelectedDate, 'yyyy-MM-dd');
      const slots = availableTimeSlots.map(slotTime => {
        const isBookedByRegularBooking = bookings.some(
          booking =>
            booking.courtId === court.id &&
            booking.date === formattedSelectedDate &&
            booking.time === slotTime
        );
        const isDuringPlayTime = isTimeInPlaySession(currentSelectedDate, slotTime, playSlotsConfig);
        
        return {
          time: slotTime,
          isBooked: isBookedByRegularBooking, 
          isPlayTime: isDuringPlayTime,     
        };
      });
      setTimeSlots(slots);
    } else {
      setTimeSlots([]);
    }
  }, [currentSelectedDate, court.id, bookings, authIsLoading]);

  const handleTimeSlotClick = (time: string) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!currentSelectedDate) {
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
  today.setHours(0, 0, 0, 0);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-xl">Verificar Disponibilidade para {court.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <Calendar
              mode="single"
              selected={currentSelectedDate}
              onSelect={onDateSelect}
              className="rounded-md border shadow-sm"
              disabled={(date) => date < today}
              locale={ptBR}
            />
          </div>
          <div className="flex-grow">
            {currentSelectedDate ? (
              <>
                <h3 className="text-lg font-semibold mb-3 text-center md:text-left">
                  Horários para {format(currentSelectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}:
                </h3>
                {authIsLoading ? (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableTimeSlots.map(slot => (
                      <Button key={slot} variant="outline" disabled className="animate-pulse h-10 bg-muted"></Button>
                    ))}
                  </div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {timeSlots.map(slot => {
                      let buttonVariant: "destructive" | "outline" | "default" = "outline";
                      let buttonText = slot.time;
                      let IconComponent = null;
                      let isDisabled = false;
                      let onClickAction = () => handleTimeSlotClick(slot.time);
                      let ariaLabel = `Reservar ${slot.time}`;

                      if (slot.isPlayTime) {
                        buttonVariant = "default"; // Use primary color for Play indication
                        buttonText = "Play!";
                        IconComponent = Swords;
                        isDisabled = false; // Play slots are clickable
                        onClickAction = () => router.push('/play');
                        ariaLabel = `Ir para a página de Play (horário ${slot.time})`;
                      } else if (slot.isBooked) {
                        buttonVariant = "destructive";
                        isDisabled = true;
                        ariaLabel = `Horário ${slot.time} indisponível`;
                      }
                      
                      return (
                        <Button
                          key={slot.time}
                          variant={buttonVariant}
                          disabled={isDisabled}
                          onClick={onClickAction}
                          className={cn(
                            "w-full transition-colors duration-150 ease-in-out group",
                            isDisabled && 'cursor-not-allowed opacity-70',
                            slot.isPlayTime && 'bg-accent text-accent-foreground hover:bg-accent/90 focus:bg-accent/90',
                            !slot.isPlayTime && !slot.isBooked && 'hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground'
                          )}
                          aria-label={ariaLabel}
                        >
                          {IconComponent && <IconComponent className="mr-1 h-4 w-4 group-hover:text-accent-foreground" />}
                          {buttonText}
                        </Button>
                      );
                    })}
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
      {currentSelectedDate && selectedTimeSlot && !isTimeInPlaySession(currentSelectedDate, selectedTimeSlot, playSlotsConfig) && (
        <BookingConfirmationDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          court={court}
          selectedDate={currentSelectedDate}
          selectedTime={selectedTimeSlot}
        />
      )}
    </Card>
  );
}
