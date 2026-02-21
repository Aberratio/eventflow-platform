import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, Mail, Calendar, ShoppingBag, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  registration: <Calendar className="h-4 w-4 text-primary" />,
  moderation: <AlertCircle className="h-4 w-4 text-primary" />,
  order: <ShoppingBag className="h-4 w-4 text-muted-foreground" />,
  message: <Mail className="h-4 w-4 text-muted-foreground" />,
  system: <Info className="h-4 w-4 text-muted-foreground" />,
};

export const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Powiadomienia">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Powiadomienia</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className="text-xs h-auto py-1"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Oznacz wszystkie
            </Button>
          )}
        </div>

        {recentNotifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Brak powiadomień</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                asChild
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !notification.read ? 'bg-muted/50' : ''
                }`}
              >
                <Link
                  to={notification.actionUrl || '#'}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="mt-0.5">{notificationIcons[notification.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: pl,
                      })}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center">
          <Link to="/notifications" className="text-primary text-sm font-medium w-full text-center py-2">
            Zobacz wszystkie powiadomienia
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
