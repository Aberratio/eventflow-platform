import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  AlertCircle, 
  Info,
  Filter
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationType } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { pl } from 'date-fns/locale';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  registration: <Calendar className="h-5 w-5 text-primary" />,
  moderation: <AlertCircle className="h-5 w-5 text-amber-500" />,
  order: <ShoppingBag className="h-5 w-5 text-green-500" />,
  message: <Mail className="h-5 w-5 text-blue-500" />,
  system: <Info className="h-5 w-5 text-muted-foreground" />,
};

const typeLabels: Record<NotificationType, string> = {
  registration: 'Rejestracje',
  moderation: 'Moderacja',
  order: 'Zamówienia',
  message: 'Wiadomości',
  system: 'Systemowe',
};

const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAll 
  } = useNotifications();
  
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredNotifications = notifications.filter(n => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (statusFilter === 'unread' && n.read) return false;
    if (statusFilter === 'read' && !n.read) return false;
    return true;
  });

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Powiadomienia</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? `Masz ${unreadCount} nieprzeczytanych powiadomień`
                : 'Wszystkie powiadomienia przeczytane'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Oznacz wszystkie
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtruj:</span>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie typy</SelectItem>
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="unread">Nieprzeczytane</SelectItem>
                  <SelectItem value="read">Przeczytane</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications list */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Lista powiadomień ({filteredNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Brak powiadomień spełniających kryteria</p>
                {(typeFilter !== 'all' || statusFilter !== 'all') && (
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setTypeFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    Wyczyść filtry
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                      !notification.read 
                        ? 'bg-muted/50 border-primary/20' 
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={notification.actionUrl || '#'}
                          onClick={() => markAsRead(notification.id)}
                          className={`font-medium hover:text-primary transition-colors ${
                            !notification.read ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {notification.title}
                        </Link>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">Nowe</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {typeLabels[notification.type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(notification.createdAt), 'dd.MM.yyyy, HH:mm', { locale: pl })}
                        </span>
                        <span>
                          ({formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: pl })})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(notification.id)}
                          title="Oznacz jako przeczytane"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                        title="Usuń"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NotificationsPage;
