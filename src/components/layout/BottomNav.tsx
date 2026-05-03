import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, ShoppingCart, User, LogIn } from 'lucide-react';
import { useAuthSafe } from '@/contexts/AuthContext';
import { useCartSafe } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const location = useLocation();
  const auth = useAuthSafe();
  const { totalItems } = useCartSafe();

  const isAuthenticated = auth?.isAuthenticated ?? false;
  const user = auth?.user ?? null;

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'participant':
        return '/participant';
      case 'organizer':
        return '/organizer';
      case 'moderator':
        return '/moderator';
      case 'admin':
      case 'superadmin':
        return '/admin';
      default:
        return '/';
    }
  };

  const navItems = [
    {
      icon: Home,
      label: 'Start',
      href: '/',
      active: location.pathname === '/',
    },
    {
      icon: Calendar,
      label: 'Wydarzenia',
      href: '/wydarzenia',
      active: location.pathname === '/wydarzenia' || location.pathname.startsWith('/events'),
    },
    {
      icon: ShoppingCart,
      label: 'Koszyk',
      href: '/cart',
      active: location.pathname === '/cart',
      badge: totalItems > 0 ? totalItems : undefined,
    },
    {
      icon: isAuthenticated ? User : LogIn,
      label: isAuthenticated ? 'Panel' : 'Zaloguj',
      href: isAuthenticated ? getDashboardLink() : '/login',
      active: isAuthenticated
        ? location.pathname.startsWith('/participant') ||
          location.pathname.startsWith('/organizer') ||
          location.pathname.startsWith('/moderator') ||
          location.pathname.startsWith('/admin')
        : location.pathname === '/login',
    },
  ];

  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'relative flex h-full flex-1 flex-col items-center justify-center transition-colors',
              item.active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="mt-1 text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
