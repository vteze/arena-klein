
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
import { Loader2, AlertCircle, MailCheck, TimerIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Endereço de email inválido." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const COUNTDOWN_SECONDS = 30;

export function ForgotPasswordForm() {
  const { sendPasswordReset, isLoading, authError, clearAuthError } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Limpar erro de autenticação ao desmontar ou se o erro mudar
    return () => {
      if (authError) clearAuthError();
    };
  }, [authError, clearAuthError]);
  
  useEffect(() => {
    if (authError) {
      setEmailSent(false); // Garante que a mensagem de sucesso não apareça se houver erro
      setIsTimerActive(false); // Para o timer se houver erro
      setCountdown(COUNTDOWN_SECONDS);
    }
  }, [authError]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isTimerActive && countdown > 0) {
      intervalId = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else if (countdown === 0 && isTimerActive) {
      setIsTimerActive(false);
      setCountdown(COUNTDOWN_SECONDS); // Reset para a próxima vez
      // Não resetamos emailSent aqui, o usuário precisa interagir com o campo de email
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTimerActive, countdown]);

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    clearAuthError();
    setEmailSent(false); // Resetar o estado de envio antes de tentar novamente
    
    await sendPasswordReset(data.email); 
    // sendPasswordReset já mostra um toast.
    // A verificação de authError APÓS a chamada é crucial.
    // A lógica para setEmailSent e iniciar o timer agora depende do sucesso da operação,
    // que é inferido pela ausência de authError *após* a chamada.
    // É importante notar que sendPasswordReset em AuthContext não retorna um booleano de sucesso.
    // Nós confiamos que se authError NÃO for definido após a chamada, a operação foi bem-sucedida.
    // Isso é uma limitação da assinatura atual de sendPasswordReset.
    // Para um feedback mais robusto, sendPasswordReset poderia retornar true/false.
    
    // Verificamos authError após a tentativa. Se não houver erro, consideramos sucesso.
    // O useAuth hook atualiza authError. Precisamos esperar essa atualização,
    // o que pode ser um pouco complicado sem um retorno explícito da função.
    // Para simplificar, vamos assumir que se o toast de sucesso aparece,
    // então está tudo bem. O `sendPasswordReset` já mostra um toast.
    // A lógica aqui é para o estado do formulário.

    // Solução: O estado de authError é atualizado no AuthContext.
    // Um useEffect em ForgotPasswordForm já lida com o authError para resetar o timer/emailSent.
    // Então, aqui, só precisamos definir emailSent como true para mostrar a mensagem e iniciar o timer,
    // *confiando* que se houver um erro, o useEffect subsequente corrigirá o estado.
    // Isso é um pouco indireto. O ideal seria sendPasswordReset retornar um booleano.

    // Tentativa mais direta:
    const wasSuccessful = !form.formState.errors.email && !authError; // Checa erro Zod E erro de auth APÓS submit
    
    // A verificação principal de erro acontece via `authError` no AuthContext.
    // A lógica abaixo é para controle de UI do formulário (timer, mensagem).
    // Se o `sendPasswordReset` for bem-sucedido, `authError` será null.
    // O hook `useAuth` lida com o toast de sucesso/erro.
    // Aqui, apenas iniciamos o timer se o toast de sucesso (implícito por não haver authError)
    // for esperado.

    // A maneira mais simples de verificar se `sendPasswordReset` teve sucesso
    // (sem modificar `sendPasswordReset` para retornar um booleano) é verificar
    // se `authError` não foi setado *após* a chamada.
    // Isso é um pouco complicado devido à natureza assíncrona e ao fato de `authError`
    // ser gerenciado no contexto.
    // Para o escopo desta correção, vamos assumir que se `sendPasswordReset`
    // não lançar um erro que é pego e seta `authError` imediatamente,
    // ele foi bem-sucedido para fins de UI aqui.

    // Uma melhoria seria `sendPasswordReset` retornar true/false.
    // Por enquanto, esta lógica funcionará para o timer se não houver `authError`
    // após a chamada da função.
    // O `useEffect` que observa `authError` corrigirá o estado se um erro ocorrer.
    
    // Solução pragmática: `sendPasswordReset` já dispara um toast.
    // A lógica de `emailSent` aqui é para controle de UI *local*.
    // Se `authError` for setado pelo `sendPasswordReset`, o `useEffect` [authError] cuidará de resetar.
    if (!authError) { // Se o AuthContext não setar um erro após a chamada
        setEmailSent(true);
        setIsTimerActive(true);
        setCountdown(COUNTDOWN_SECONDS);
    }
  };

  const handleEmailInputChange = () => {
    if (authError) clearAuthError();
    if (form.formState.errors.email) {
        form.clearErrors("email");
    }
    // Se o email foi enviado ou um timer estava ativo, resetar tudo ao digitar
    if (emailSent || isTimerActive) {
      setEmailSent(false);
      setIsTimerActive(false);
      setCountdown(COUNTDOWN_SECONDS);
    }
  };
  
  const getButtonText = () => {
    if (isLoading) return "Enviando...";
    if (isTimerActive) return `Aguarde ${countdown}s`;
    if (emailSent && !authError && !isTimerActive) return "Link Enviado"; // Adicionado !isTimerActive
    return "Enviar Link de Redefinição";
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
        <CardDescription>
          Digite seu email para enviarmos um link de redefinição de senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {emailSent && !authError && !isTimerActive && (
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
              disabled={isLoading || isTimerActive} 
              onChange={handleEmailInputChange}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          {isTimerActive && (
            <div className="text-sm text-muted-foreground p-2 text-center border rounded-md bg-muted/50 flex items-center justify-center gap-2">
              <TimerIcon className="h-4 w-4"/>
              <span>Você poderá solicitar um novo link em <strong>{countdown}</strong> segundos.</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || isTimerActive || (emailSent && !authError && !isTimerActive)} // Adicionado !isTimerActive à condição de desabilitar
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getButtonText()}
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

