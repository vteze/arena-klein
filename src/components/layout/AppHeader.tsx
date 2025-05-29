
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, LogOut, ListChecks, HomeIcon as HomeLucideIcon } from 'lucide-react';
import { APP_NAME } from '@/config/appConfig';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLogo } from '@/components/icons/AppLogo'; // Changed import
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { currentUser, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Início', icon: HomeLucideIcon },
    { href: '/my-bookings', label: 'Minhas Reservas', icon: ListChecks },
  ];

  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted"></div>
            <div className="h-6 w-32 rounded bg-muted"></div>
          </div>
          <div className="h-8 w-20 rounded bg-muted animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-8 flex items-center gap-2">
          <AppLogo /> {/* Changed to AppLogo */}
          <span className="font-bold text-lg whitespace-nowrap">{APP_NAME}</span>
        </Link>
        
        <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(currentUser.name)}`} alt={currentUser.name} data-ai-hint="avatar perfil" />
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
            <Button asChild variant="outline">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
