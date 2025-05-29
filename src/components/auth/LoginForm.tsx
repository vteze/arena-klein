
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

// Schema de validação para o formulário de login
// A senha DEVE ter pelo menos 6 caracteres para ser enviada ao Firebase.
// Se a senha tiver menos de 6 caracteres, o erro virá daqui (Zod).
// Se a senha tiver 6+ caracteres mas estiver incorreta, o erro virá do Firebase (ex: "Senha incorreta").
const loginSchema = z.object({
  email: z.string().email({ message: "Endereço de email inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, authError, clearAuthError } = useAuth();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Clear error when component unmounts or form values change
    return () => {
      if (authError) clearAuthError();
    };
  }, [authError, clearAuthError]);

  const onSubmit = async (data: LoginFormValues) => {
    clearAuthError(); // Clear previous errors
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
              onChange={() => authError && clearAuthError()}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Sua Senha"
              {...form.register("password")}
              disabled={isLoading}
              onChange={() => authError && clearAuthError()}
            />
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
        <p>Não tem uma conta?</p>
        <Button variant="link" asChild className="p-0 h-auto">
          <Link href="/register">Cadastre-se aqui</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
