
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { courts } from '@/config/appConfig';
import { CourtCard } from '@/components/courts/CourtCard';
import { AvailabilityCalendar } from '@/components/courts/AvailabilityCalendar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { CalendarDays, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  // Lifted state for globally selected date
  const [globallySelectedDate, setGloballySelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <div className="space-y-10"> {/* Adjusted overall page spacing */}
        <section className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-background to-background py-16 sm:py-20 lg:py-24 text-center shadow-inner">
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] dark:bg-bottom dark:border-b dark:border-slate-100/5"></div>
          <div className="relative px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl lg:text-6xl xl:text-7xl">
              Arena Klein Beach Tennis
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-foreground/80 sm:text-xl lg:text-2xl">
              Seu paraíso particular para o beach tennis. Reserve sua quadra e venha se divertir!
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {isClient ? (
                <>
                  <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-shadow">
                    <Link href="#courts-section">
                      <CalendarDays />
                      Ver Quadras
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow">
                    <Link href="/my-bookings">
                      <ListChecks />
                      Minhas Reservas
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  {/* Placeholder to match server render and avoid layout shift */}
                  <div className="h-11 w-full sm:w-40 rounded-md bg-muted opacity-50" />
                  <div className="h-11 w-full sm:w-48 rounded-md bg-muted opacity-50" />
                </>
              )}
            </div>
          </div>
        </section>

        <section id="courts-section" className="space-y-10">
          <div className="text-center mb-10 sm:mb-12"> {/* Adjusted spacing */}
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Nossas Quadras
            </h2>
            <p className="mt-3 text-lg text-foreground/70">
              Escolha a quadra ideal para o seu jogo.
            </p>
          </div>
          {courts.map((court, index) => {
            return (
              <div key={court.id} className="flex flex-col items-center space-y-6"> {/* Reduced spacing between card and calendar */}
                <CourtCard court={court} className="w-full max-w-3xl" />
                <AvailabilityCalendar
                  court={court}
                  className="w-full max-w-3xl"
                  currentSelectedDate={globallySelectedDate}
                  onDateSelect={setGloballySelectedDate}
                />
                {index < courts.length - 1 && (
                  <Separator className="my-8 w-full max-w-3xl" /> /* Adjusted separator margin */
                )}
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}
