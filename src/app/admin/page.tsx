
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, Line, ResponsiveContainer } from 'recharts'; // Direct import from recharts
import { courts } from '@/config/appConfig';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, BarChart3, CalendarCheck, Users, ShieldAlert, UsersRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartData {
  name: string;
  total?: number;
  count?: number;
  [key: string]: any; // For multiple bars/lines
}

export default function AdminDashboardPage() {
  const { currentUser, isAdmin, bookings, playSignUps, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [currentUser, isAdmin, authLoading, router]);

  const totalBookings = useMemo(() => bookings.length, [bookings]);
  const totalPlaySignUps = useMemo(() => playSignUps.length, [playSignUps]);

  const bookingsPerCourt: ChartData[] = useMemo(() => {
    return courts.map(court => ({
      name: court.name,
      total: bookings.filter(b => b.courtId === court.id).length,
    }));
  }, [bookings]);

  const bookingsLast7Days: ChartData[] = useMemo(() => {
    const data: ChartData[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const formattedDay = format(day, 'yyyy-MM-dd');
      const count = bookings.filter(b => b.date === formattedDay).length;
      data.push({ name: format(day, 'dd/MM', { locale: ptBR }), count });
    }
    return data;
  }, [bookings]);

  const playSignUpsLast7Days: ChartData[] = useMemo(() => {
    const data: ChartData[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const formattedDay = format(day, 'yyyy-MM-dd');
      const count = playSignUps.filter(ps => ps.date === formattedDay).length; // Assuming playSignUps have a 'date' field
      data.push({ name: format(day, 'dd/MM', { locale: ptBR }), count });
    }
    return data;
  }, [playSignUps]);

  const mostPopularCourt = useMemo(() => {
    if (bookingsPerCourt.length === 0) return "N/A";
    return bookingsPerCourt.reduce((prev, current) => (prev.total! > current.total!) ? prev : current).name;
  }, [bookingsPerCourt]);


  if (authLoading || !isClient) {
    return (
      <div className="space-y-8 p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/3" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
         <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    // This should ideally be handled by AuthContext redirect, but as a fallback:
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }
  
  // Fill color for charts (using Tailwind's primary color, converted from HSL)
  // Primary: 223 54% 22% -> #192A56
  const chartPrimaryFill = "hsl(var(--primary))"; 
  const chartAccentFill = "hsl(var(--accent))";

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Painel de Administração</h1>
          <p className="text-muted-foreground">Visão geral do sistema e métricas importantes.</p>
        </div>
         <div className="flex items-center gap-2 p-2 border border-destructive/50 bg-destructive/10 rounded-md text-destructive">
            <ShieldAlert className="h-5 w-5"/>
            <span>Modo Administrador</span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4 text-primary/90">Visão Geral</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings}</div>
              <p className="text-xs text-muted-foreground">Reservas de quadra ativas no sistema.</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inscrições no "Play"</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlaySignUps}</div>
              <p className="text-xs text-muted-foreground">Total de inscrições em sessões "Play".</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quadra Mais Popular</CardTitle>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={mostPopularCourt}>{mostPopularCourt}</div>
              <p className="text-xs text-muted-foreground">Baseado no número de reservas.</p>
            </CardContent>
          </Card>
           <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários (Placeholder)</CardTitle>
              <UsersRound className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">N/D</div>
              <p className="text-xs text-muted-foreground">Total de usuários registrados.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Charts Section */}
      <section className="space-y-8">
        <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-4 text-primary/90">Atividade de Reservas</h2>
            <div className="grid gap-8 md:grid-cols-2">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Reservas por Quadra</CardTitle>
                <CardDescription>Distribuição de reservas entre as quadras disponíveis.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bookingsPerCourt}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        itemStyle={{ color: chartPrimaryFill }}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}}/>
                    <Bar dataKey="total" fill={chartPrimaryFill} name="Total de Reservas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Reservas nos Últimos 7 Dias</CardTitle>
                 <CardDescription>Volume de reservas de quadra dia a dia.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bookingsLast7Days}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        itemStyle={{ color: chartPrimaryFill }}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}}/>
                    <Line type="monotone" dataKey="count" stroke={chartPrimaryFill} name="Reservas" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            </div>
        </div>
        
        <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-4 text-primary/90">Atividade "Play"</h2>
             <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Inscrições no "Play" nos Últimos 7 Dias</CardTitle>
                <CardDescription>Volume de inscrições nas sessões "Play".</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={playSignUpsLast7Days}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                     <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        itemStyle={{ color: chartAccentFill }}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}}/>
                    <Line type="monotone" dataKey="count" stroke={chartAccentFill} name="Inscrições Play" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        </div>
      </section>
      
      <Card className="mt-10 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl">Notas e Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><Activity className="inline h-4 w-4 mr-1"/>Os gráficos de "Reservas/Inscrições nos Últimos 7 Dias" são baseados nos dados carregados no momento. Para histórico completo (meses/anos), seria necessário um backend para agregar dados do Firestore.</p>
            <p><UsersRound className="inline h-4 w-4 mr-1"/>A métrica "Total de Usuários" é um placeholder. Para exibi-la, seria preciso uma forma de contar os usuários da autenticação ou da coleção 'users'.</p>
            <p>Este dashboard pode ser expandido com mais gráficos, como horários de pico, taxas de cancelamento, etc., conforme a necessidade e a disponibilidade de dados agregados.</p>
        </CardContent>
      </Card>

    </div>
  );
}

    