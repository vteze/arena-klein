
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

const registerSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Endereço de email inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "A confirmação de senha deve ter pelo menos 6 caracteres." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"], // path of error
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { signUp, isLoading, authError, clearAuthError } = useAuth();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Clear error when component unmounts or form values change
    return () => {
      if (authError) clearAuthError();
    };
  }, [authError, clearAuthError]);

  const onSubmit = async (data: RegisterFormValues) => {
    clearAuthError();
    await signUp(data.name, data.email, data.password);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Crie Sua Conta</CardTitle>
        <CardDescription>Preencha os campos abaixo para se registrar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {authError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro de Cadastro</AlertTitle>
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu Nome Completo"
              {...form.register("name")}
              disabled={isLoading}
              onChange={() => authError && clearAuthError()}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
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
              placeholder="Crie uma Senha"
              {...form.register("password")}
              disabled={isLoading}
              onChange={() => authError && clearAuthError()}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirme Sua Senha"
              {...form.register("confirmPassword")}
              disabled={isLoading}
              onChange={() => authError && clearAuthError()}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <p>Já tem uma conta?</p>
        <Button variant="link" asChild className="p-0 h-auto">
          <Link href="/login">Faça login aqui</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
