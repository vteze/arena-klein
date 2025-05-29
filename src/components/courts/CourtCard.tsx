
import Image from 'next/image';
import type { Court } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Asterisk } from 'lucide-react'; // Changed from Sun, CloudSun

interface CourtCardProps {
  court: Court;
}

export function CourtCard({ court }: CourtCardProps) {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={court.imageUrl}
            alt={court.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={court.dataAiHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <CardTitle className="flex items-center gap-2 text-2xl mb-2">
          <Asterisk className="h-6 w-6 text-primary" /> {/* Changed icon to Asterisk for both types */}
          {court.name}
        </CardTitle>
        <CardDescription>{court.description}</CardDescription>
      </CardContent>
    </Card>
  );
}
