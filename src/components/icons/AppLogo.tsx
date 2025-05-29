
import Image from 'next/image';

export function AppLogo() {
  // IMPORTANT: Replace this placeholder with your actual logo.
  // 1. Download your logo image.
  // 2. Create a folder `public/images/`.
  // 3. Place your logo file there (e.g., `public/images/logo.png`).
  // 4. Change the src below to `/images/logo.png` (or your actual file name).
  return (
    <Image
      src="https://placehold.co/36x36.png?text=Logo" // Placeholder, update this path
      alt="Arena Klein Beach Tennis Logo"
      width={36} 
      height={36} 
      className="h-9 w-9 rounded-sm" 
      data-ai-hint="logo empresa" // This hint is for internal tools if you regenerate images
      priority 
    />
  );
}
