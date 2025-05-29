
import type { SVGProps } from 'react';

// Este componente não está mais sendo usado diretamente no AppHeader,
// foi substituído por AppLogo.tsx.
// Mantido caso seja útil em outro lugar ou para referência.
export function BeachTennisRacketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="15.5" cy="8.5" r="5.5" />
      <line x1="15.5" y1="14" x2="8" y2="21.5" />
      <line x1="12" y1="8.5" x2="19" y2="8.5" />
      <line x1="15.5" y1="5" x2="15.5" y2="12" />
    </svg>
  );
}
