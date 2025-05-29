
import Image from 'next/image';

export function AppLogo() {
  return (
    <Image
      src="https://placehold.co/80x80.png?text=Logo" // Placeholder - substitua pelo caminho do seu logo real
      alt="Arena Klein Beach Tennis Logo"
      width={36} // Ajustado para melhor visualização, pode precisar de mais ajustes
      height={36} // Ajustado para melhor visualização
      className="h-9 w-9 rounded-sm" // Ajustado para melhor visualização
      data-ai-hint="logo empresa"
    />
  );
}
