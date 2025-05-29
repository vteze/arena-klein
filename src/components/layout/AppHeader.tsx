
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, LogOut, ListChecks, HomeIcon as HomeLucideIcon, UserPlus, HelpCircle, Swords } from 'lucide-react';
import { APP_NAME } from '@/config/appConfig';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLogo } from '@/components/icons/AppLogo';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '../ui/skeleton'; 

export function AppHeader() {
  const { currentUser, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const navLinksBase = [
    { href: '/', label: 'Início', icon: HomeLucideIcon },
    { href: '/play', label: 'Play!', icon: Swords },
    { href: '/faq', label: 'FAQ', icon: HelpCircle },
  ];
  
  let navLinks = [...navLinksBase];

  if (currentUser) {
    const playIndex = navLinks.findIndex(link => link.href === '/play');
    if (playIndex !== -1) {
      navLinks.splice(playIndex + 1, 0, { href: '/my-bookings', label: 'Minhas Reservas', icon: ListChecks });
    } else {
      navLinks.push({ href: '/my-bookings', label: 'Minhas Reservas', icon: ListChecks });
    }
  }


  const getInitials = (name: string = "") => {
    const nameParts = name.split(' ');
    if (nameParts.length === 1 && nameParts[0].length > 0) return nameParts[0].substring(0,2).toUpperCase();
    return nameParts
      .map(n => n[0])
      .filter(Boolean) 
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-sm" />
            <Skeleton className="h-6 w-40 rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-md bg-muted" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-3 sm:mr-4 md:mr-6 flex items-center gap-2 shrink-0">
          <AppLogo />
          <span className="font-semibold text-base sm:text-lg">{APP_NAME}</span>
        </Link>
        
        <nav className="flex items-center gap-1 text-sm font-medium overflow-x-auto whitespace-nowrap">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 p-2 md:px-3 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground shrink-0",
                pathname === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={currentUser.name ? `https://placehold.co/100x100.png?text=${getInitials(currentUser.name)}` : `https://placehold.co/100x100.png`}
                      alt={currentUser.name || 'User Avatar'} 
                      data-ai-hint="avatar perfil" 
                    />
                    <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">
                  <LogIn className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Entrar</span>
                </Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href="/register">
                  <UserPlus className="h-4 w-4 md:mr-2" />
                   <span className="hidden md:inline">Registrar</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
