
"use client";

import { useState, useEffect } from 'react';
import { format, parse, isEqual, startOfDay } from 'date-fns';
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

interface AvailabilityCalendarProps {
  court: Court;
}

export function AvailabilityCalendar({ court }: AvailabilityCalendarProps) {
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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Check Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border shadow-sm"
              disabled={(date) => date < today}
              initialFocus
            />
          </div>
          <div className="flex-grow">
            {selectedDate ? (
              <>
                <h3 className="text-lg font-semibold mb-3">
                  Available Slots for {format(selectedDate, 'MMMM do, yyyy')}:
                </h3>
                {authIsLoading ? (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableTimeSlots.map(slot => (
                      <Button key={slot} variant="outline" disabled className="animate-pulse h-10 bg-muted"></Button>
                    ))}
                  </div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {timeSlots.map(slot => (
                      <Button
                        key={slot.time}
                        variant={slot.isBooked ? "destructive" : "outline"}
                        disabled={slot.isBooked}
                        onClick={() => !slot.isBooked && handleTimeSlotClick(slot.time)}
                        className={`w-full ${slot.isBooked ? 'cursor-not-allowed' : 'hover:bg-primary hover:text-primary-foreground'}`}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No time slots configured.</p>
                )}
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Select a Date</AlertTitle>
                <AlertDescription>
                  Please pick a date from the calendar to see available time slots.
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

