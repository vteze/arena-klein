
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, CalendarClock, Users, CheckCircle, Swords } from "lucide-react";
import Link from "next/link";

export default function PlayPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      <header className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Swords className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Entre no Jogo: Sessões "Play" na Arena Klein!
          </h1>
        </div>
        <p className="text-lg text-foreground/70">
          Descubra uma nova forma de jogar beach tennis com horários fixos, muita diversão e novos parceiros de jogo.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold text-primary mb-4">O que são as Sessões "Play"?</h2>
        <p className="text-foreground/80 leading-relaxed">
          As sessões "Play" na Arena Klein são horários pré-definidos e fixos dedicados a jogos organizados de beach tennis. Você pode se inscrever individualmente para garantir sua vaga, sem a necessidade de montar um grupo. É a oportunidade perfeita para quem busca um jogo garantido, quer conhecer novos jogadores e socializar, tudo isso em um ambiente amigável e bem estruturado.
          {/* Arena Klein fornecerá: Sua definição e filosofia específica do "Play". */}
        </p>
      </section>

      <Card className="shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary">
            <ListChecks />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/80">
          <div>
            <h3 className="font-semibold text-primary mb-1">Agenda e Horários</h3>
            <p>
              Disponibilizamos uma grade com horários fixos para as sessões "Play". Consulte nossa agenda online para ver os dias e horários disponíveis.
              {/* Arena Klein fornecerá: Detalhes específicos sobre agenda */}
            </p>
            <Button variant="link" asChild className="p-0 h-auto mt-1 text-accent hover:text-accent/90">
                <Link href="#">Ver Grade de Horários (Em Breve)</Link>
            </Button>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Inscrição</h3>
            <p>
              As vagas são limitadas para garantir a qualidade das sessões! Você pode se inscrever diretamente pelo nosso site ou entrando em contato conosco.
              {/* Arena Klein fornecerá: processo de inscrição */}
            </p>
            <Button variant="link" asChild className="p-0 h-auto mt-1 text-accent hover:text-accent/90">
                <Link href="#">Inscreva-se Aqui (Em Breve)</Link>
            </Button>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Formato da Sessão</h3>
            <p>
              Durante as sessões "Play", os jogos são organizados em formato de rodízio, garantindo que todos os participantes joguem e interajam com diferentes parceiros e oponentes. O foco é a diversão e a prática esportiva!
              {/* Arena Klein fornecerá: formato dos jogos */}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Exclusividade dos Horários</h3>
            <p>
              É importante notar que os horários dedicados às sessões "Play" são exclusivos para esta modalidade. Durante esses períodos, as quadras não estarão disponíveis para aluguel avulso, garantindo o espaço para os participantes do "Play".
            </p>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
          <CheckCircle />
          Vantagens de Participar do "Play"
        </h2>
        <ul className="list-disc list-inside space-y-3 text-foreground/80 pl-4">
          <li><strong>Conveniência e Jogo Garantido:</strong> Chegue e jogue! Horários fixos sem a preocupação de encontrar parceiros ou quadra disponível.</li>
          <li><strong>Socialização e Networking:</strong> Uma ótima maneira de conhecer novos jogadores, fazer amigos e ampliar sua rede de contatos no beach tennis.</li>
          <li><strong>Diversidade de Jogos:</strong> Jogue com e contra diferentes pessoas, aprimorando sua adaptabilidade e tática.</li>
          <li><strong>Ambiente Organizado:</strong> Sessões bem estruturadas pela equipe da Arena Klein para garantir a melhor experiência.</li>
          <li><strong>Foco na Diversão:</strong> Menos organização, mais tempo para o que realmente importa: jogar e se divertir!</li>
          {/* Arena Klein fornecerá: Vantagens específicas de suas sessões. */}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
          <Users />
          Para Quem é o "Play"?
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          As sessões "Play" são ideais para jogadores de todos os níveis que buscam uma forma regular, divertida e organizada de praticar beach tennis. Seja você iniciante querendo ganhar mais experiência em diferentes situações de jogo, ou um jogador mais avançado procurando por parceiros variados e jogos dinâmicos, o "Play" é para você! É perfeito para quem tem uma agenda corrida mas não abre mão de uma boa partida.
          {/* Arena Klein fornecerá: Perfil do público que desejam atrair. */}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-primary mb-4">Equipamento Necessário</h2>
        <p className="text-foreground/80 leading-relaxed">
          Para participar, você precisará de sua raquete de beach tennis e roupas esportivas adequadas. Não se preocupe com as bolinhas, nós as fornecemos! Caso precise, também oferecemos raquetes para as sessões.
          {/* Arena Klein fornecerá: Política de fornecimento de bolinhas e aluguel de raquetes. */}
        </p>
      </section>

      <section className="text-center mt-12 py-10 bg-gradient-to-r from-primary/5 via-background to-background rounded-lg shadow-sm border border-border/50">
        <h2 className="text-3xl font-bold text-primary mb-4">
          Pronto para Entrar em Quadra?
        </h2>
        <p className="text-lg text-foreground/70 mb-8 max-w-xl mx-auto">
          Não perca tempo! Verifique nossa grade de horários e garanta sua vaga nas próximas sessões "Play". Estamos te esperando!
        </p>
        <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:shadow-lg transition-shadow" asChild>
          <Link href="#">
            <CalendarClock className="mr-2" />
            Ver Agenda e Inscrever-se (Em Breve)
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Para mais informações, entre em contato conosco.
          {/* Arena Klein fornecerá: Links diretos para agenda/inscrição e informações de contato relevantes. */}
        </p>
      </section>
    </div>
  );
}
