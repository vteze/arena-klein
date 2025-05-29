
"use client";

import type { PlaySignUp, PlaySlotConfig } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { maxParticipantsPerPlaySlot } from '@/config/appConfig';
import { useState } from 'react';
import Link from 'next/link';

interface PlaySlotDisplayProps {
  slotConfig: PlaySlotConfig;
  date: string; // YYYY-MM-DD (for logic)
  displayDate: string; // dd/MM (for display in title)
  allSignUps: PlaySignUp[]; // Todas as inscrições para filtrar
}

export function PlaySlotDisplay({ slotConfig, date, displayDate, allSignUps }: PlaySlotDisplayProps) {
  const { currentUser, signUpForPlaySlot, cancelPlaySlotSignUp, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const relevantSignUps = allSignUps.filter(
    (signUp) => signUp.slotKey === slotConfig.key && signUp.date === date
  );

  const currentUserSignUp = relevantSignUps.find(
    (signUp) => signUp.userId === currentUser?.id
  );

  const isSlotFull = relevantSignUps.length >= maxParticipantsPerPlaySlot;

  const handleSignUp = async () => {
    if (!currentUser) {
      return;
    }
    setIsSubmitting(true);
    try {
      await signUpForPlaySlot(slotConfig.key, date, {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
      });
    } catch (error) {
      console.error("Erro no handleSignUp:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSignUp = async () => {
    if (!currentUserSignUp) return;
    setIsSubmitting(true);
    try {
      await cancelPlaySlotSignUp(currentUserSignUp.id);
    } catch (error) {
      console.error("Erro no handleCancelSignUp:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getInitials = (name: string = "") => {
    const nameParts = name.split(' ');
    if (nameParts.length === 1 && nameParts[0].length > 0) return nameParts[0].substring(0,2).toUpperCase();
    return nameParts
      .map(n => n[0])
      .filter(Boolean) 
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{slotConfig.label} - {displayDate}</CardTitle>
        <CardDescription>{slotConfig.timeRange}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-primary flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Participantes ({relevantSignUps.length}/{maxParticipantsPerPlaySlot})
            </h4>
            {isSlotFull && !currentUserSignUp && (
                <span className="text-sm font-medium text-destructive">Vagas Esgotadas!</span>
            )}
          </div>
          {relevantSignUps.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {relevantSignUps.map((signUp) => (
                <div key={signUp.id} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                        src={`https://placehold.co/40x40.png?text=${getInitials(signUp.userName)}`} 
                        alt={signUp.userName} 
                        data-ai-hint="avatar perfil"
                    />
                    <AvatarFallback>{getInitials(signUp.userName)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate" title={signUp.userName}>{signUp.userName}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Ninguém inscrito ainda. Seja o primeiro!</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {!currentUser ? (
          <Button asChild className="w-full">
            <Link href="/login">
              <UserPlus className="mr-2" />
              Faça login para se inscrever
            </Link>
          </Button>
        ) : currentUserSignUp ? (
          <Button
            variant="destructive"
            onClick={handleCancelSignUp}
            disabled={isSubmitting || authLoading}
            className="w-full"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <UserMinus className="mr-2" />}
            Cancelar Inscrição
          </Button>
        ) : isSlotFull ? (
          <Button disabled className="w-full">
            Vagas Esgotadas
          </Button>
        ) : (
          <Button
            onClick={handleSignUp}
            disabled={isSubmitting || authLoading}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2" />}
            Inscrever-se no Play
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
