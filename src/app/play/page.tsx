
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, CalendarClock, Users, CheckCircle, Swords, CalendarDays } from "lucide-react";
import Link from "next/link";
import { playSlotsConfig, numberOfWeeksToDisplayPlaySlots, maxParticipantsPerPlaySlot } from '@/config/appConfig';
import { PlaySlotDisplay } from '@/components/play/PlaySlotDisplay';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays, nextDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Função para gerar as próximas N datas para um dia da semana específico
const getNextOccurrences = (dayOfWeek: number, count: number): string[] => {
  const dates: string[] = [];
  let currentDate = new Date();
  currentDate.setHours(0,0,0,0); // Normalizar para o início do dia

  // Encontrar a primeira ocorrência a partir de amanhã ou do dia da semana se for hoje e ainda não tiver começado.
  let firstOccurrence = nextDay(currentDate, dayOfWeek);
  if (currentDate.getDay() === dayOfWeek && currentDate.getTime() <= new Date().setHours(0,0,0,0) ) {
    // Se hoje é o dia da semana e ainda não passou (ou é exatamente meia-noite),
    // a lógica de nextDay pode pular para a próxima semana.
    // Aqui garantimos que se "hoje" é o dia alvo, e é válido, ele é considerado.
    // No entanto, para "próximas" semanas, a lógica de nextDay é geralmente o que queremos.
    // A lógica atual com nextDay(currentDate, dayOfWeek) já lida bem com isso,
    // avançando para a próxima ocorrência se a data atual já passou ou é o próprio dia.
    // Para simplificar, vamos usar a lógica de `nextDay` e ajustar se necessário.
    // A lógica atual de `nextDay` é: se hoje é sexta e `dayOfWeek` é 5 (sexta),
    // `nextDay` retornará a *próxima* sexta, a menos que modifiquemos `currentDate`
    // para `addDays(currentDate, -1)` antes da primeira chamada.
    // Mas para N ocorrências, um loop simples com `nextDay` a partir de `currentDate` funciona.
  }


  for (let i = 0; i < count; i++) {
    // Para a primeira iteração, calcula a próxima ocorrência a partir de hoje.
    // Para as subsequentes, a partir da última data encontrada.
    const nextOccurrenceDate = nextDay(currentDate, dayOfWeek);
    dates.push(format(nextOccurrenceDate, 'yyyy-MM-dd'));
    currentDate = nextOccurrenceDate; // Atualiza para a próxima busca ser a partir desta data
  }
  return dates;
};


export default function PlayPage() {
  const { playSignUps, isLoading: authLoading } = useAuth();

  const today = new Date();
  today.setHours(0,0,0,0);

  // Gerar as datas para os slots de Play
  const upcomingPlaySlots = playSlotsConfig.map(slot => ({
    ...slot,
    dates: getNextOccurrences(slot.dayOfWeek, numberOfWeeksToDisplayPlaySlots)
            .map(dateStr => ({
                date: dateStr,
                formattedDate: format(new Date(dateStr + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })
            }))
            .filter(d => new Date(d.date + 'T00:00:00') >= today)
  }));


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
          Junte-se às nossas sessões "Play"! Horários fixos, vagas limitadas, muita diversão e a chance de conhecer novos parceiros de jogo. Inscreva-se individualmente e garanta sua partida.
        </p>
      </header>

      <section className="space-y-8">
        <h2 className="text-3xl font-semibold text-primary text-center mb-8 flex items-center justify-center gap-2">
          <CalendarDays className="mr-2 h-8 w-8" /> Próximas Sessões "Play"
        </h2>

        {authLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-60 w-full rounded-lg" />)}
          </div>
        )}

        {!authLoading && upcomingPlaySlots.map((slotType, typeIndex) => (
          slotType.dates.length > 0 && (
            <div key={slotType.key} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {slotType.dates.map(dateInfo => (
                  <PlaySlotDisplay
                    key={`${slotType.key}-${dateInfo.date}`}
                    slotConfig={slotType}
                    date={dateInfo.date}
                    allSignUps={playSignUps}
                  />
                ))}
              </div>
              {typeIndex < upcomingPlaySlots.filter(s => s.dates.length > 0).length - 1 && <Separator className="my-10" />}
            </div>
          )
        ))}
         {!authLoading && upcomingPlaySlots.every(slot => slot.dates.length === 0) && (
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
        <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-shadow" asChild>
          {/* Use um seletor de ID para rolar para a seção de sessões */}
          <Link href="#upcoming-play-sessions"> 
            <CalendarClock className="mr-2 h-5 w-5" />
            Ver Sessões e Inscrever-se
          </Link>
        </Button>
      </section>
    </div>
  );
}

// Adiciona um id ao título da seção para o link de âncora
const OriginalPlayPage = PlayPage;
export default function PlayPageWithAnchor() {
  return (
    <div id="page-content"> {/* Adiciona um wrapper se necessário para o scroll */}
        <OriginalPlayPage />
    </div>
  )
}
// Modificação para que a seção de "Próximas Sessões Play" tenha um ID para ancoragem
const OriginalH2 = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 {...props}>{children}</h2>
);

PlayPage = function PatchedPlayPage() {
  const { playSignUps, isLoading: authLoading } = useAuth();
  const today = new Date();
  today.setHours(0,0,0,0);

  const upcomingPlaySlots = playSlotsConfig.map(slot => ({
    ...slot,
    dates: getNextOccurrences(slot.dayOfWeek, numberOfWeeksToDisplayPlaySlots)
            .map(dateStr => ({
                date: dateStr,
                formattedDate: format(new Date(dateStr + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })
            }))
            .filter(d => new Date(d.date + 'T00:00:00') >= today) 
  }));

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
          Junte-se às nossas sessões "Play"! Horários fixos, vagas limitadas, muita diversão e a chance de conhecer novos parceiros de jogo. Inscreva-se individualmente e garanta sua partida.
        </p>
      </header>

      {/* Adicionado id="upcoming-play-sessions" aqui */}
      <section id="upcoming-play-sessions" className="space-y-8 scroll-mt-20"> 
        <h2 className="text-3xl font-semibold text-primary text-center mb-8 flex items-center justify-center gap-2">
          <CalendarDays className="mr-2 h-8 w-8" /> Próximas Sessões "Play"
        </h2>

        {authLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-60 w-full rounded-lg" />)}
          </div>
        )}

        {!authLoading && upcomingPlaySlots.map((slotType, typeIndex) => (
          slotType.dates.length > 0 && (
            <div key={slotType.key} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {slotType.dates.map(dateInfo => (
                  <PlaySlotDisplay
                    key={`${slotType.key}-${dateInfo.date}`}
                    slotConfig={slotType}
                    date={dateInfo.date}
                    allSignUps={playSignUps}
                  />
                ))}
              </div>
              {typeIndex < upcomingPlaySlots.filter(s => s.dates.length > 0).length - 1 && <Separator className="my-10" />}
            </div>
          )
        ))}
         {!authLoading && upcomingPlaySlots.every(slot => slot.dates.length === 0) && (
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
        <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-shadow" asChild>
          <Link href="#upcoming-play-sessions">
            <CalendarClock className="mr-2 h-5 w-5" />
            Ver Sessões e Inscrever-se
          </Link>
        </Button>
      </section>
    </div>
  );
};
// Atribui o nome de exibição explicitamente para evitar problemas com HMR ou linters
PlayPage.displayName = "PlayPage";

// Exporta a versão modificada como padrão
export { PlayPage as default };

