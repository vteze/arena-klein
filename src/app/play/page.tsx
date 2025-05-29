
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, CalendarClock, Users, Swords, CalendarDays } from "lucide-react";
import Link from "next/link";
import { playSlotsConfig, numberOfWeeksToDisplayPlaySlots, maxParticipantsPerPlaySlot, type PlaySlotConfig } from '@/config/appConfig';
import { PlaySlotDisplay } from '@/components/play/PlaySlotDisplay';
import { useAuth } from '@/hooks/useAuth';
import { format, nextDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Interface para uma instância individual de Play Slot
interface PlaySlotInstance {
  slotConfig: PlaySlotConfig;
  date: string; // YYYY-MM-DD para lógica
  displayDate: string; // DD/MM para exibição
  uniqueKey: string; // Para chaves React
}

// Função para gerar as próximas N datas para um dia da semana específico
const getNextOccurrences = (dayOfWeek: number, count: number): Array<{ date: string; displayDate: string }> => {
  const occurrences: Array<{ date: string; displayDate: string }> = [];
  let currentDate = new Date();
  currentDate.setHours(0,0,0,0); // Normalizar para o início do dia

  for (let i = 0; i < count; i++) {
    const nextOccurrenceDate = nextDay(currentDate, dayOfWeek);
    occurrences.push({
      date: format(nextOccurrenceDate, 'yyyy-MM-dd'),
      displayDate: format(nextOccurrenceDate, 'dd/MM', { locale: ptBR })
    });
    currentDate = nextOccurrenceDate; 
  }
  return occurrences;
};

function PlayPage() {
  const { playSignUps, isLoading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [chronologicallySortedPlaySlots, setChronologicallySortedPlaySlots] = useState<PlaySlotInstance[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const allUpcomingSlots: PlaySlotInstance[] = [];

    playSlotsConfig.forEach(slot => {
      const occurrences = getNextOccurrences(slot.dayOfWeek, numberOfWeeksToDisplayPlaySlots);
      occurrences.forEach(occ => {
        if (new Date(occ.date + 'T00:00:00') >= today) {
          allUpcomingSlots.push({
            slotConfig: slot,
            date: occ.date,
            displayDate: occ.displayDate,
            uniqueKey: `${slot.key}-${occ.date}`
          });
        }
      });
    });

    // Ordenar cronologicamente
    allUpcomingSlots.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    setChronologicallySortedPlaySlots(allUpcomingSlots);

  }, [numberOfWeeksToDisplayPlaySlots]);


  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-12">
      <header className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Swords className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Entre no Jogo: Sessões "Play" na Arena Klein!
          </h1>
        </div>
        <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
          Junte-se às nossas sessões "Play"! Horários fixos, vagas limitadas ({maxParticipantsPerPlaySlot} por sessão), muita diversão e a chance de conhecer novos parceiros de jogo. Inscreva-se individualmente e garanta sua partida. As sessões "Play" utilizam ambas as quadras.
        </p>
      </header>

      <section id="upcoming-play-sessions" className="space-y-8 scroll-mt-20"> 
        <h2 className="text-3xl font-semibold text-primary text-center mb-8 flex items-center justify-center gap-2">
          <CalendarDays className="mr-2 h-8 w-8" /> Próximas Sessões "Play"
        </h2>

        {authLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-60 w-full rounded-lg" />)}
          </div>
        )}

        {!authLoading && chronologicallySortedPlaySlots.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {chronologicallySortedPlaySlots.map(slotInstance => (
              <PlaySlotDisplay
                key={slotInstance.uniqueKey}
                slotConfig={slotInstance.slotConfig}
                date={slotInstance.date}
                displayDate={slotInstance.displayDate}
                allSignUps={playSignUps}
              />
            ))}
          </div>
        )}
        
         {!authLoading && chronologicallySortedPlaySlots.length === 0 && (
            <Card className="text-center py-10">
                <CardContent>
                    <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-xl font-medium text-muted-foreground">Nenhuma sessão "Play" agendada para as próximas semanas.</p>
                    <p className="text-muted-foreground mt-2">Por favor, verifique novamente mais tarde ou entre em contato.</p>
                </CardContent>
            </Card>
        )}
      </section>

      <Separator className="my-12" />

      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <ListChecks className="mr-2 h-6 w-6" />
            Como Funciona o "Play"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/80">
           <div>
            <h3 className="font-semibold text-primary mb-1">Agenda e Horários Fixos</h3>
            <p>
              As sessões "Play" acontecem em horários fixos: Sextas, Sábados e Domingos, das 16:00 às 20:00. Veja as datas disponíveis acima e inscreva-se!
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Inscrição Individual</h3>
            <p>
              As vagas são limitadas a {maxParticipantsPerPlaySlot} participantes por sessão para garantir uma ótima experiência de jogo e interação. Faça sua inscrição individualmente através desta página para garantir sua vaga. É necessário estar logado.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Formato da Sessão</h3>
            <p>
              Durante as sessões "Play", que utilizam ambas as quadras da arena, os jogos são organizados de forma dinâmica, geralmente em formato de rodízio ou desafios. Isso garante que todos os participantes joguem bastante e interajam com diferentes parceiros e oponentes. O foco é a diversão, a prática esportiva e a socialização!
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Exclusividade dos Horários</h3>
            <p>
              Os horários dedicados às sessões "Play" (Sexta, Sábado e Domingo, das 16:00 às 20:00) são exclusivos para esta modalidade. Durante esses períodos, ambas as quadras da arena são reservadas para o "Play" e não estarão disponíveis para aluguel avulso, garantindo o espaço para os participantes inscritos.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <section className="text-center mt-12 py-10 bg-gradient-to-r from-primary/5 via-background to-background rounded-lg shadow-sm border border-border/50">
        <h2 className="text-3xl font-bold text-primary mb-4">
          Pronto para Entrar em Quadra?
        </h2>
        <p className="text-lg text-foreground/70 mb-8 max-w-xl mx-auto">
          Não perca tempo! Verifique as datas disponíveis acima e garanta sua vaga nas próximas sessões "Play". Estamos te esperando!
        </p>
        {isClient ? (
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-shadow" asChild>
            <Link href="#upcoming-play-sessions">
              <CalendarClock className="mr-2 h-5 w-5" />
              Ver Sessões e Inscrever-se
            </Link>
          </Button>
        ) : (
           <div className="h-11 w-64 rounded-md bg-muted opacity-50 mx-auto" />
        )}
      </section>
    </div>
  );
}

export default PlayPage;

    