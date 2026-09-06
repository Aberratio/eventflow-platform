import { getActivityLogs } from '@/api';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  Search,
  Filter,
  LogIn,
  LogOut,
  UserCog,
  UserX,
  CheckCircle,
  XCircle,
  Package,
  ShoppingBag,
  Settings,
  Key,
} from 'lucide-react';
import { AdminActionType } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const ACTION_ICONS: Record<AdminActionType, React.ReactNode> = {
  login: <LogIn className="h-4 w-4 text-success" />,
  logout: <LogOut className="h-4 w-4 text-muted-foreground" />,
  user_edit: <UserCog className="h-4 w-4 text-info" />,
  user_delete: <UserX className="h-4 w-4 text-destructive" />,
  event_approve: <CheckCircle className="h-4 w-4 text-success" />,
  event_reject: <XCircle className="h-4 w-4 text-destructive" />,
  order_update: <Package className="h-4 w-4 text-muted-foreground" />,
  product_edit: <ShoppingBag className="h-4 w-4 text-warning" />,
  settings_change: <Settings className="h-4 w-4 text-muted-foreground" />,
  password_change: <Key className="h-4 w-4 text-warning" />,
};

const ACTION_LABELS: Record<AdminActionType, string> = {
  login: 'Logowanie',
  logout: 'Wylogowanie',
  user_edit: 'Edycja użytkownika',
  user_delete: 'Usunięcie użytkownika',
  event_approve: 'Zatwierdzenie wydarzenia',
  event_reject: 'Odrzucenie wydarzenia',
  order_update: 'Aktualizacja zamówienia',
  product_edit: 'Edycja produktu',
  settings_change: 'Zmiana ustawień',
  password_change: 'Zmiana hasła',
};

export const ActivityLogsSection = () => {
  const [logFilter, setLogFilter] = useState<AdminActionType | 'all'>('all');
  const [logSearch, setLogSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);

  const { data: logsResp } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => getActivityLogs(),
    select: (r) => r.data ?? [],
  });

  const allLogs = logsResp ?? [];

  const filteredLogs = allLogs.filter((log) => {
    const matchesFilter = logFilter === 'all' || log.action === logFilter;
    const matchesSearch =
      logSearch === '' ||
      log.description.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.targetName?.toLowerCase().includes(logSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Logi aktywności
        </CardTitle>
        <CardDescription>Historia Twoich działań w systemie</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj w logach..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={logFilter}
            onValueChange={(v) => setLogFilter(v as AdminActionType | 'all')}
          >
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtruj" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie akcje</SelectItem>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {filteredLogs.slice(0, visibleCount).map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
            >
              <div className="mt-0.5">{ACTION_ICONS[log.action]}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{log.description}</span>
                  {log.targetName && (
                    <Badge variant="secondary" className="text-xs">
                      {log.targetName}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {format(new Date(log.timestamp), 'dd.MM.yyyy, HH:mm', { locale: pl })}
                  </span>
                  {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              Nie znaleziono logów spełniających kryteria.
            </p>
          )}

          {visibleCount < filteredLogs.length && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setVisibleCount((prev) => prev + 5)}
            >
              Załaduj więcej ({filteredLogs.length - visibleCount} pozostało)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
