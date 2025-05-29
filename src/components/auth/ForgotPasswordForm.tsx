
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
    return () => {
      if (authError) clearAuthError();
    };
  }, [authError, clearAuthError]);

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    clearAuthError();
    setEmailSent(false); // Reset email sent state
    await sendPasswordReset(data.email);
    // A função sendPasswordReset já mostra um toast de sucesso/erro
    // Se não houver authError após a chamada, consideramos que o processo (tentativa de envio) foi "concluído"
    // O Firebase não confirma se o email realmente existe, apenas se o formato é válido e a tentativa de envio foi feita.
    if (!authError) { // Verifica o estado do authError *após* a tentativa
      setEmailSent(true); // Assume que a tentativa foi bem-sucedida se nenhum erro foi setado
    }
  };
  
  // Atualiza o estado de emailSent se authError mudar após a submissão
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
        {emailSent && !authError && (
           <Alert variant="default" className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/30">
            <MailCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-700 dark:text-green-300">Verifique seu Email</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-500">
              Se uma conta existir para o email fornecido, um link para redefinição de senha foi enviado.
            </AlertDescription>
          </Alert>
        )}
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
              disabled={isLoading || emailSent} // Desabilita após envio bem-sucedido
              onChange={() => {
                if (authError) clearAuthError();
                if (emailSent) setEmailSent(false); // Permite nova tentativa
              }}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || emailSent}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {emailSent ? "Link Enviado" : "Enviar Link de Redefinição"}
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
          <div className="h-[calc(1.25rem_+_theme(spacing.1)_+_1.25rem)] w-full" />
        )}
      </CardFooter>
    </Card>
  );
}
