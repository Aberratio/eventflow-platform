import {
  mockSalesStats,
  mockOnlineSessions,
  mockEvents,
  mockRegistrations,
  mockShopOrders,
  mockUsers,
} from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  Users,
  Shield,
  Settings,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Package,
  Clock,
  ShoppingCart,
  UserCheck,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { OnlineStaffCard } from './OnlineStaffCard';

export const AdminOverviewTab = () => {
  const pendingModerationCount = mockEvents.filter((e) => e.status === 'awaiting_approval').length;

  const stats = [
    {
      label: 'Wydarzeń',
      value: mockEvents.length,
      icon: Calendar,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Użytkowników',
      value: mockUsers.length,
      icon: Users,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Administratorów',
      value: mockUsers.filter((u) => u.role === 'admin').length,
      icon: Shield,
      color: 'bg-destructive/10 text-destructive',
    },
    {
      label: 'Organizatorów',
      value: mockUsers.filter((u) => u.role === 'organizer').length,
      icon: Settings,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Rejestracji',
      value: mockRegistrations.length,
      icon: TrendingUp,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Do moderacji',
      value: pendingModerationCount,
      icon: Clock,
      color:
        pendingModerationCount > 0 ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary',
    },
  ];

  const revenueChartConfig = {
    revenue: {
      label: 'Przychód',
      color: 'hsl(var(--primary))',
    },
  };

  const pieChartConfig = {
    count: {
      label: 'Zamówienia',
    },
    Dostarczone: {
      label: 'Dostarczone',
      color: 'hsl(var(--chart-1))',
    },
    Wysłane: {
      label: 'Wysłane',
      color: 'hsl(var(--chart-2))',
    },
    Opłacone: {
      label: 'Opłacone',
      color: 'hsl(var(--chart-3))',
    },
    Oczekujące: {
      label: 'Oczekujące',
      color: 'hsl(var(--chart-4))',
    },
    Anulowane: {
      label: 'Anulowane',
      color: 'hsl(var(--chart-5))',
    },
  };

  const totalRevenue = mockSalesStats.monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
  const totalOrders = mockShopOrders.length;

  const adminCount = mockOnlineSessions.filter((s) => s.role === 'admin').length;
  const moderatorCount = mockOnlineSessions.filter((s) => s.role === 'moderator').length;

  return (
    <div className="space-y-6">
      {/* Online Staff Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Aktualnie zalogowani administratorzy i moderatorzy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mockOnlineSessions.map((session) => (
              <OnlineStaffCard key={session.userId} session={session} />
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Zalogowanych: {adminCount} {adminCount === 1 ? 'admin' : 'adminów'}, {moderatorCount}{' '}
            {moderatorCount === 1 ? 'moderator' : 'moderatorów'}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Przychody ze sklepu (ostatnie 6 miesięcy)
            </CardTitle>
            <div className="text-right">
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString('pl-PL')} zł</div>
              <div className="text-sm text-muted-foreground">Łącznie</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
            <BarChart
              data={mockSalesStats.monthlyRevenue}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                className="text-muted-foreground"
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`${value.toLocaleString('pl-PL')} zł`, 'Przychód']}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Products & Orders by Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Najpopularniejsze produkty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSalesStats.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">Sprzedano: {product.sold} szt.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{product.revenue.toLocaleString('pl-PL')} zł</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Zamówienia wg statusu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieChartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={mockSalesStats.ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, count }) => `${status}: ${count}`}
                  labelLine={false}
                >
                  {mockSalesStats.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {mockSalesStats.ordersByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-muted-foreground">{item.status}:</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold">Ostatnie rejestracje</h3>
            <div className="space-y-3">
              {mockRegistrations.slice(0, 5).map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{reg.userName}</div>
                    <div className="text-sm text-muted-foreground">{reg.eventName}</div>
                  </div>
                  <span className="rounded bg-muted px-2 py-1 text-xs">{reg.distanceName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold">Nadchodzące wydarzenia</h3>
            <div className="space-y-3">
              {mockEvents
                .filter((e) => e.status === 'published')
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground">{event.date}</div>
                    </div>
                    <span className="rounded bg-muted px-2 py-1 text-xs">{event.city}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
