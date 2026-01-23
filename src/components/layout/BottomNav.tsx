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
      case 'admin':
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
      href: '/events',
      active: location.pathname.startsWith('/events'),
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
          location.pathname.startsWith('/admin')
        : location.pathname === '/login',
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full relative transition-colors',
              item.active
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
