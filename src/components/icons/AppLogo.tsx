
import Image from 'next/image';

export function AppLogo() {
  return (
    <Image
      src="/ak.jpg" // Caminho atualizado para o arquivo na pasta public
      alt="Arena Klein Beach Tennis Logo"
      width={36} 
      height={36} 
      className="h-9 w-9 rounded-sm" 
      data-ai-hint="logo empresa"
      priority 
    />
  );
}
