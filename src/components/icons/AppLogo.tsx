
import Image from 'next/image';

export function AppLogo() {
  return (
    <Image
      src="https://instagram.fpoa33-1.fna.fbcdn.net/v/t51.2885-19/473827377_1323265858702337_4678191838278651412_n.jpg?_nc_ht=instagram.fpoa33-1.fna.fbcdn.net&_nc_cat=105&_nc_oc=Q6cZ2QESHWNKt_etXoKiFmsfe0Ju6JpnciYRvkBE4m55YwNyC8j_2MDXcyyK4pFHZeu7UaVMOoMfdsRdXv6oGBuSNnSX&_nc_ohc=wVgK-HNv-OQQ7kNvwFx4yh1&_nc_gid=Nw5wh3r1aZSCARjvQ2dtZQ&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AfJLGSJECs162FmPRFn0wwfS_yswY6XB6Mn-mxhlRjHerQ&oe=683E4006&_nc_sid=7a9f4b"
      alt="Arena Klein Beach Tennis Logo"
      width={36} 
      height={36} 
      className="h-9 w-9 rounded-sm" 
      data-ai-hint="logo empresa"
      priority // Adding priority as it's part of the LCP in the header
    />
  );
}
