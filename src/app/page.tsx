
import { courts } from '@/config/appConfig';
import { CourtCard } from '@/components/courts/CourtCard';
import { AvailabilityCalendar } from '@/components/courts/AvailabilityCalendar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-16">
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
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-shadow">
              <Link href="#courts-section">Ver Quadras</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/my-bookings">Minhas Reservas</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="courts-section" className="space-y-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Nossas Quadras
          </h2>
          <p className="mt-3 text-lg text-foreground/70">
            Escolha a quadra ideal para o seu jogo.
          </p>
        </div>
        {courts.map((court, index) => (
          <div key={court.id} className="space-y-8">
            <CourtCard court={court} />
            <AvailabilityCalendar court={court} />
            {index < courts.length - 1 && <Separator className="my-16" />}
          </div>
        ))}
      </section>
    </div>
  );
}
