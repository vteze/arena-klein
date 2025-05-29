
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqData = [
  {
    question: "Preciso levar minha própria raquete e bolinhas?",
    answer:
      "Oferecemos aluguel de raquetes e bolinhas na recepção por uma pequena taxa. Você também é bem-vindo a trazer seu próprio equipamento, se preferir.",
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
      "Sim, oferecemos estacionamento no local para nossos clientes durante o período de uso das nossas instalações. As vagas são sujeitas à disponibilidade.",
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
              {item.question}
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
