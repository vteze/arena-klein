
import { courts } from '@/config/appConfig';
import { CourtCard } from '@/components/courts/CourtCard';
import { AvailabilityCalendar } from '@/components/courts/AvailabilityCalendar';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          Reserve Seu Jogo
        </h1>
        <p className="mt-4 text-lg text-foreground/80 sm:text-xl">
          Encontre quadras disponíveis e reserve seu lugar na Arena Klein Beach Tennis.
        </p>
      </section>

      {courts.map((court, index) => (
        <div key={court.id} className="space-y-8">
          <CourtCard court={court} />
          <AvailabilityCalendar court={court} />
          {index < courts.length - 1 && <Separator className="my-12" />}
        </div>
      ))}
    </div>
  );
}
