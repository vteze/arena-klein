
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BookingListItem } from '@/components/bookings/BookingListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ListChecks, PlusCircle, UserCog } from 'lucide-react'; // Added UserCog for admin
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MyBookingsPage() {
  const { currentUser, bookings, isLoading, isAdmin } = useAuth(); // Added isAdmin
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3 p-4 border rounded-lg shadow-sm bg-card">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null; 
  }

  // If user is admin, show all bookings. Otherwise, show only their bookings.
  const bookingsToDisplay = isAdmin 
    ? bookings 
    : bookings.filter(b => b.userId === currentUser.id);

  const sortedBookingsToDisplay = bookingsToDisplay.sort((a, b) => 
    new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isAdmin ? <UserCog className="h-10 w-10 text-destructive"/> : <ListChecks className="h-10 w-10 text-primary"/>}
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdmin ? "Todas as Reservas (Admin)" : "Minhas Reservas"}
          </h1>
        </div>
        <Button asChild variant="default" size="lg">
          <Link href="/">
            <PlusCircle />
            Reservar Nova Quadra
          </Link>
        </Button>
      </div>
      
      {sortedBookingsToDisplay.length > 0 ? (
        <>
          {isAdmin && (
            <Alert variant="destructive" className="mb-6">
                <UserCog className="h-4 w-4"/>
                <AlertTitle>Modo Administrador</AlertTitle>
                <AlertDescription>Você está visualizando todas as reservas do sistema. Cancelamentos feitos aqui são permanentes.</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedBookingsToDisplay.map(booking => (
              <BookingListItem 
                key={booking.id} 
                booking={booking} 
                showUserName={isAdmin} // Pass prop to show user name if admin
              />
            ))}
          </div>
        </>
      ) : (
        <Alert className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhuma Reserva Encontrada</AlertTitle>
          <AlertDescription>
            {isAdmin ? "Nenhuma reserva encontrada no sistema." : "Você ainda não fez nenhuma reserva. Que tal encontrar uma quadra disponível agora mesmo?"}
          </AlertDescription>
          <div className="mt-4">
            <Button asChild>
              <Link href="/">Ver Quadras Disponíveis</Link>
            </Button>
          </div>
        </Alert>
      )}
    </div>
  );
}
