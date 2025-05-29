
import type { ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, MapPin } from "lucide-react"; // Adicionado MapPin

interface FaqItem {
  question: string;
  answer: ReactNode; // Alterado para ReactNode para permitir JSX no mapa
  icon?: React.ElementType;
}

const faqData: FaqItem[] = [
  {
    question: "Preciso levar minha própria raquete e bolinhas?",
    answer:
      "Oferecemos aluguel de raquetes e bolinhas na recepção sem taxas extras. Você também é bem-vindo a trazer seu próprio equipamento, se preferir.",
  },
  {
    question: "Qual tipo de calçado devo usar para jogar beach tennis?",
    answer:
      "Recomendamos jogar descalço para melhor aderência e sensação na areia. Se preferir, meias específicas para esportes na areia (sand socks) são permitidas. Calçados fechados ou com solado rígido não são permitidos nas quadras para preservar a qualidade da areia e garantir a segurança.",
  },
  {
    question: "Vocês oferecem aulas de beach tennis?",
    answer:
      "Sim! Temos aulas para todos os níveis, desde iniciantes até jogadores avançados, com instrutores qualificados. Consulte nossa seção de aulas em breve ou entre em contato conosco para mais informações sobre horários, disponibilidade e pacotes.",
  },
  {
    question: "Como funciona o cancelamento de reservas de quadra?",
    answer:
      "Você pode cancelar suas reservas diretamente através da seção 'Minhas Reservas' em nosso site ou aplicativo. Pedimos que os cancelamentos sejam feitos com pelo menos 24 horas de antecedência para evitar taxas. Consulte nossa política completa de cancelamento para mais detalhes.",
  },
  {
    question: "Posso levar comida e bebida para a arena?",
    answer:
      "Dispomos de uma lanchonete com uma variedade de snacks, bebidas e lanches rápidos. Não é permitido o consumo de alimentos e bebidas trazidos de fora, com exceção de garrafas de água pessoais.",
  },
  {
    question: "A arena possui estacionamento disponível?",
    answer:
      "A arena não possui estacionamento próprio. No entanto, é geralmente possível estacionar na Rua Comendador Rodolfo Gomes, em Porto Alegre, bem em frente à arena. Recomendamos sempre observar a sinalização local de trânsito e restrições de estacionamento.",
  },
  {
    question: "Qual a diferença principal entre a quadra coberta e a não-coberta?",
    answer:
      "A quadra coberta permite que você jogue confortavelmente independentemente das condições climáticas, como chuva ou sol intenso. A quadra não-coberta proporciona a experiência clássica do beach tennis ao ar livre. Ambas as quadras são mantidas com os mesmos padrões de qualidade da areia.",
  },
  {
    question: "Como faço para reservar uma quadra?",
    answer:
      "Você pode reservar uma quadra diretamente através do nosso site ou aplicativo. Basta selecionar a quadra desejada, a data, o horário e seguir as instruções para confirmar sua reserva. É necessário estar logado para realizar uma reserva.",
  },
  {
    question: "Onde fica a Arena Klein Beach Tennis?",
    icon: MapPin,
    answer: (
      <div className="space-y-4">
        <p>
          Estamos localizados na Rua Comendador Rodolfo Gomes, no bairro Menino Deus, em Porto Alegre - RS.
        </p>
        <div className="overflow-hidden rounded-md border shadow-sm aspect-video w-full max-w-2xl mx-auto">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d863.5067995687858!2d-51.2285289!3d-30.0548237!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95197900600c160f%3A0x514097a0fc2f141c!2sArena%20Klein%20Beach%20Tennis!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
            width="100%"
            height="100%" // Height will be controlled by aspect-video parent
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa da Localização da Arena Klein Beach Tennis"
          ></iframe>
        </div>
        <p className="text-sm text-muted-foreground">
          Você pode clicar no mapa para interagir ou obter direções.
        </p>
      </div>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <HelpCircle className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Perguntas Frequentes
          </h1>
        </div>
        <p className="text-lg text-foreground/70">
          Encontre respostas para as dúvidas mais comuns sobre a Arena Klein Beach Tennis.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqData.map((item, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="border-b border-border/70">
            <AccordionTrigger className="text-left text-lg hover:no-underline py-4 font-medium text-foreground">
              <div className="flex items-center gap-2">
                {item.icon && <item.icon className="h-5 w-5 text-primary flex-shrink-0" />}
                <span>{item.question}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 text-base text-foreground/80">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
