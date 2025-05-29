
import Image from 'next/image';
import akLogo from './ak.jpg'; // Importa a imagem localmente

export function AppLogo() {
  return (
    <Image
      src={akLogo} // Usa a imagem importada
      alt="Arena Klein Beach Tennis Logo"
      width={36}
      height={36}
      className="h-9 w-9 rounded-sm"
      data-ai-hint="logo empresa"
      priority
    />
  );
}
