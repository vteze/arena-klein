
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle, MailCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Endereço de email inválido." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { sendPasswordReset, isLoading, authError, clearAuthError } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    // Limpar erro de autenticação ao desmontar ou se o erro mudar
    return () => {
      if (authError) clearAuthError();
    };
  }, [authError, clearAuthError]);

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    clearAuthError();
    setEmailSent(false); // Resetar o estado de envio antes de tentar novamente
    const success = await sendPasswordReset(data.email);
    // sendPasswordReset no AuthContext já mostra um toast.
    // Aqui, atualizamos o estado local `emailSent` APENAS se não houver authError após a chamada.
    // Se authError for definido por sendPasswordReset, emailSent permanecerá/se tornará false.
    if (!authError) { // Verifica o estado de authError *após* a tentativa de envio
        setEmailSent(true);
    }
  };
  
  // Se authError for atualizado (por exemplo, por uma falha no envio),
  // garante que emailSent seja false para não mostrar a mensagem de sucesso.
  useEffect(() => {
    if (authError) {
      setEmailSent(false);
    }
  }, [authError]);


  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
        <CardDescription>
          Digite seu email para enviarmos um link de redefinição de senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Exibe alerta de sucesso SE emailSent for true E não houver authError */}
        {emailSent && !authError && (
           <Alert variant="default" className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/30">
            <MailCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-700 dark:text-green-300">Verifique seu Email</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-500">
              Se uma conta existir para o email fornecido, um link para redefinição de senha foi enviado.
            </AlertDescription>
          </Alert>
        )}
        {/* Exibe alerta de erro se authError estiver presente */}
        {authError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Falha ao Enviar Link</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              {...form.register("email")}
              // Desabilita o input se estiver carregando OU se o email foi enviado com sucesso (e não há erro)
              disabled={isLoading || (emailSent && !authError)} 
              onChange={() => {
                // Se o usuário começar a digitar novamente:
                if (authError) clearAuthError(); // Limpa o erro anterior
                if (emailSent) setEmailSent(false); // Permite uma nova tentativa, reabilita o botão
              }}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            // Desabilita o botão se estiver carregando OU se o email foi enviado com sucesso (e não há erro)
            disabled={isLoading || (emailSent && !authError)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Enviando..." : (emailSent && !authError) ? "Link Enviado" : "Enviar Link de Redefinição"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {isClient ? (
          <>
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/login">Voltar para Login</Link>
            </Button>
          </>
        ) : (
          // Placeholder para SSR, para evitar layout shift
          <div className="h-[calc(1.25rem_+_theme(spacing.1)_+_1.25rem)] w-full" /> 
        )}
      </CardFooter>
    </Card>
  );
}

    