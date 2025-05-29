
import Image from 'next/image';
import type { Court } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, CloudSun } from 'lucide-react';

interface CourtCardProps {
  court: Court;
}

export function CourtCard({ court }: CourtCardProps) {
  return (
    <Card className="overflow-hidden">
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
          {court.type === 'covered' ? <CloudSun className="h-6 w-6 text-primary" /> : <Sun className="h-6 w-6 text-primary" />}
          {court.name}
        </CardTitle>
        <CardDescription>{court.description}</CardDescription>
      </CardContent>
    </Card>
  );
}
