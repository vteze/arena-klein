
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
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email({ message: "Endereço de email inválido." }),
  password: z.string().trim().min(1, { message: "Digite sua senha." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, authError, clearAuthError } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: 'onSubmit', 
    reValidateMode: 'onChange', 
  });

  useEffect(() => {
    return () => {
      if (authError) clearAuthError();
    };
  }, [authError, clearAuthError]);

  const onSubmit = async (data: LoginFormValues) => {
    console.log('LoginForm onSubmit triggered. Password length:', data.password.length, 'Data:', JSON.stringify(data));
    clearAuthError(); 
    await login(data.email, data.password);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Bem-vindo de Volta!</CardTitle>
        <CardDescription>Digite seu email e senha para acessar sua conta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/*
            Se authError estiver presente, um erro de login do Firebase ocorreu.
            A mensagem em authError é definida pela função getFirebaseErrorMessage em AuthContext.
            Para "auth/invalid-credential", a mensagem será "Credenciais inválidas. Verifique seu email e senha."
          */}
          {authError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro de Login</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              {...form.register("email")}
              disabled={isLoading}
              onChange={() => {
                if (authError) clearAuthError();
              }}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              {isClient && (
                <Button variant="link" asChild className="p-0 h-auto text-xs">
                  <Link href="/forgot-password">Esqueceu a senha?</Link>
                </Button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Sua Senha"
              {...form.register("password")}
              disabled={isLoading}
              onChange={() => {
                if (authError) clearAuthError();
              }}
            />
            {/* A mensagem de erro "A senha deve ter pelo menos 6 caracteres." vem da validação Zod (cliente) */}
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {isClient ? (
          <>
            <p>Não tem uma conta?</p>
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/register">Cadastre-se aqui</Link>
            </Button>
          </>
        ) : (
          <div className="h-[calc(1.25rem_+_theme(spacing.1)_+_1.25rem)] w-full" />
        )}
      </CardFooter>
    </Card>
  );
}
