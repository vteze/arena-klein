
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, Line, ResponsiveContainer } from 'recharts';
import { courts } from '@/config/appConfig';
import { format, subDays, parseISO, eachDayOfInterval, isWithinInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, BarChart3, CalendarCheck, Users, ShieldAlert, UsersRound, CalendarDays as CalendarIconLucide } from 'lucide-react'; // Renamed to avoid conflict
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ChartData {
  name: string;
  total?: number;
  count?: number;
  [key: string]: any; 
}

export default function AdminDashboardPage() {
  const { currentUser, isAdmin, bookings, playSignUps, bookingActivities, totalUsers, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [activityPage, setActivityPage] = useState(1);
  const activitiesPerPage = 10;

  const totalBookings = useMemo(() => bookings.length, [bookings]);
  const totalPlaySignUpsCount = useMemo(() => playSignUps.length, [playSignUps]);

  const bookingsPerCourt: ChartData[] = useMemo(() => {
    return courts.map(court => ({
      name: court.name,
      total: bookings.filter(b => b.courtId === court.id).length,
    }));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (!startDate || !endDate) return bookings;
    const start = startOfDay(startDate);
    const end = startOfDay(endDate); 
    return bookings.filter(b => {
      try {
        const bookingDate = parseISO(b.date);
        return isWithinInterval(bookingDate, { start, end });
      } catch (e) {
        console.warn(`Invalid date format for booking id ${b.id}: ${b.date}`);
        return false;
      }
    });
  }, [bookings, startDate, endDate]);

  const filteredPlaySignUps = useMemo(() => {
    if (!startDate || !endDate) return playSignUps;
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);
    return playSignUps.filter(ps => {
       try {
        const signUpDate = parseISO(ps.date);
        return isWithinInterval(signUpDate, { start, end });
      } catch (e) {
        console.warn(`Invalid date format for play sign up id ${ps.id}: ${ps.date}`);
        return false;
      }
    });
  }, [playSignUps, startDate, endDate]);

  const bookingsLastPeriod: ChartData[] = useMemo(() => {
    if (!startDate || !endDate || !filteredBookings) return [];
    const range = eachDayOfInterval({ start: startDate, end: endDate });
    return range.map(day => {
      const formattedDay = format(day, 'yyyy-MM-dd');
      const count = filteredBookings.filter(b => b.date === formattedDay).length;
      return { name: format(day, 'dd/MM', { locale: ptBR }), count };
    });
  }, [filteredBookings, startDate, endDate]);

  const playSignUpsLastPeriod: ChartData[] = useMemo(() => {
    if (!startDate || !endDate || !filteredPlaySignUps) return [];
    const range = eachDayOfInterval({ start: startDate, end: endDate });
    return range.map(day => {
      const formattedDay = format(day, 'yyyy-MM-dd');
      const count = filteredPlaySignUps.filter(ps => ps.date === formattedDay).length;
      return { name: format(day, 'dd/MM', { locale: ptBR }), count };
    });
  }, [filteredPlaySignUps, startDate, endDate]);

  const mostPopularCourt = useMemo(() => {
    if (bookingsPerCourt.length === 0) return "N/A";
    return bookingsPerCourt.reduce((prev, current) => (prev.total! > current.total!) ? prev : current).name;
  }, [bookingsPerCourt]);

  const filteredActivities = useMemo(() => {
    const activities = bookingActivities.filter(
      a => activityFilter === 'all' || a.action === activityFilter
    );
    return activities.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
  }, [bookingActivities, activityFilter]);

  const totalActivityPages = Math.ceil(filteredActivities.length / activitiesPerPage) || 1;

  const paginatedActivities = useMemo(() => {
    const start = (activityPage - 1) * activitiesPerPage;
    return filteredActivities.slice(start, start + activitiesPerPage);
  }, [filteredActivities, activityPage]);

  useEffect(() => {
    setActivityPage(1);
  }, [activityFilter]);
  
  const dateRangeLabel = useMemo(() => {
    if (startDate && endDate) {
      return `${format(startDate, "dd/MM/yy", { locale: ptBR })} - ${format(endDate, "dd/MM/yy", { locale: ptBR })}`;
    }
    return "Últimos 7 dias";
  }, [startDate, endDate]);

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
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }
  
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
              <p className="text-xs text-muted-foreground">Reservas de quadra no sistema.</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inscrições no "Play"</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlaySignUpsCount}</div>
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
              <p className="text-xs text-muted-foreground">Baseado no nº total de reservas.</p>
            </CardContent>
          </Card>
           <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <UsersRound className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total de usuários registrados.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Filters Section */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4 text-primary/90">Filtros de Período</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIconLucide className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Data Inicial</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                locale={ptBR}
                disabled={(date) => 
                  (endDate ? date > endDate : false) || 
                  date < new Date("2000-01-01")
                }
              />
            </PopoverContent>
          </Popover>
           <span className="text-muted-foreground hidden sm:inline">-</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIconLucide className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Data Final</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                locale={ptBR}
                disabled={(date) =>
                  (startDate ? date < startDate : false) ||
                  date < new Date("1900-01-01") // Only very old dates as lower bound
                }
              />
            </PopoverContent>
          </Popover>
        </div>
         {(!startDate || !endDate) && <p className="text-sm text-destructive mt-2">Por favor, selecione uma data inicial e final para os gráficos de período.</p>}
      </section>

      {/* Charts Section */}
      <section className="space-y-8">
        <div>
            <h2 className="text-2xl font-semibold tracking-tight mb-4 text-primary/90">Atividade de Reservas</h2>
            <p className="text-sm text-muted-foreground mb-4">Exibindo dados para o período: {dateRangeLabel}</p>
            <div className="grid gap-8 md:grid-cols-2">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Reservas por Quadra (Total)</CardTitle>
                <CardDescription>Distribuição total de reservas entre as quadras.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bookingsPerCourt}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
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
                <CardTitle>Reservas no Período Selecionado</CardTitle>
                 <CardDescription>Volume de reservas de quadra dia a dia no período.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bookingsLastPeriod}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
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
            <p className="text-sm text-muted-foreground mb-4">Exibindo dados para o período: {dateRangeLabel}</p>
             <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Inscrições no "Play" no Período Selecionado</CardTitle>
                <CardDescription>Volume de inscrições nas sessões "Play" no período.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={playSignUpsLastPeriod}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
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
          <CardTitle className="text-xl">Registro de Atividades</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Filtrar por:</span>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="created">Reserva</SelectItem>
                  <SelectItem value="canceled">Cancelamento</SelectItem>
                  <SelectItem value="updated">Atualização</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setActivityPage(p => Math.max(1, p - 1))} disabled={activityPage === 1}>Anterior</Button>
              <span className="text-sm">Página {activityPage} de {totalActivityPages}</span>
              <Button variant="outline" size="sm" onClick={() => setActivityPage(p => Math.min(totalActivityPages, p + 1))} disabled={activityPage === totalActivityPages}>Próxima</Button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left">Quando</th>
                <th className="px-2 py-1 text-left">Ação</th>
                <th className="px-2 py-1 text-left">Quadra</th>
                <th className="px-2 py-1 text-left">Usuário</th>
              </tr>
            </thead>
            <tbody>
              {paginatedActivities.map(activity => (
                <tr key={activity.id} className="border-t">
                  <td className="px-2 py-1">{activity.timestamp?.toDate ? format(activity.timestamp.toDate(), 'dd/MM/yyyy HH:mm') : ''}</td>
                  <td className="px-2 py-1">
                    {activity.action === 'created' ? 'Reserva' : activity.action === 'canceled' ? 'Cancelamento' : 'Atualização'}
                  </td>
                  <td className="px-2 py-1">{activity.courtName} ({activity.date} {activity.time})</td>
                  <td className="px-2 py-1">{activity.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="mt-10 shadow-md">
        <CardHeader>
            <CardTitle className="text-xl">Notas e Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><Activity className="inline h-4 w-4 mr-1"/>Os gráficos de atividade por período são baseados nos dados carregados no momento. Para histórico completo e mais performance em grandes volumes, seria necessário um backend para agregar dados do Firestore.</p>
            <p>Este dashboard pode ser expandido com mais gráficos (ex: horários de pico, taxas de cancelamento) e filtros mais avançados (ex: por tipo de quadra).</p>
        </CardContent>
      </Card>

    </div>
  );
}
