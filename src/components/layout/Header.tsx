import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthSafe } from '@/contexts/AuthContext';
import { useCartSafe } from '@/contexts/CartContext';
import {
  Timer,
  Menu,
  X,
  User,
  LogOut,
  Calendar,
  Settings,
  LayoutDashboard,
  ShoppingCart,
  Radio,
  History,
  Package,
  Trophy,
  Layers,
  Flame,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const roleLabels = {
  participant: 'Uczestnik',
  organizer: 'Organizator',
  moderator: 'Moderator',
  admin: 'Administrator',
  superadmin: 'Superadmin',
};

const roleBadgeVariants = {
  participant: 'secondary',
  organizer: 'default',
  moderator: 'outline',
  admin: 'destructive',
  superadmin: 'destructive',
} as const;

export const Header = () => {
  const auth = useAuthSafe();
  const { totalItems } = useCartSafe();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMobileMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const user = auth?.user ?? null;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const logout = auth?.logout ?? (() => {});

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
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

  const isActive = (path: string) => location.pathname === path;
  const isActivePrefix = (prefix: string) => location.pathname.startsWith(prefix);

  const navLinkClass = (active: boolean) =>
    cn(
      'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground',
      active ? 'text-foreground' : 'text-muted-foreground',
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--header-border))] bg-[hsl(var(--header-bg)/0.90)] backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <Timer className="h-4 w-4 text-primary" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Zmierzymy<span className="text-primary">Czas</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          <Link
            to="/wydarzenia"
            className={navLinkClass(isActive('/wydarzenia') || isActivePrefix('/events'))}
          >
            Kalendarz
          </Link>

          <Link to="/series" className={navLinkClass(isActivePrefix('/series'))}>
            Serie
          </Link>

          <Link
            to="/wyniki/live"
            className={cn(navLinkClass(isActivePrefix('/wyniki')), 'flex items-center gap-1.5')}
          >
            <Radio className="h-3 w-3 text-destructive" />
            Wyniki live
          </Link>

          <Link to="/challenges" className={navLinkClass(isActivePrefix('/challenges'))}>
            Wyzwania
          </Link>

          <Link
            to="/shop"
            className={navLinkClass(
              isActive('/sklep') || isActive('/shop') || isActivePrefix('/shop'),
            )}
          >
            Sklep
          </Link>

          <div className="mx-1 h-4 w-px bg-border" />

          {totalItems > 0 && (
            <Link
              to="/cart"
              className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Koszyk"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            </Link>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="ml-1 gap-2 text-muted-foreground hover:text-foreground"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate text-foreground">{user?.name}</span>
                  <Badge
                    variant={roleBadgeVariants[user?.role || 'participant']}
                    className="text-xs"
                  >
                    {roleLabels[user?.role || 'participant']}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => {
                    const target = getDashboardLink();
                    if (location.pathname === target) {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      navigate(target);
                    }
                  }}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Panel
                </DropdownMenuItem>
                {user?.role === 'participant' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/participant?tab=registrations')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Nadchodzące starty
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/participant?tab=history')}>
                      <History className="mr-2 h-4 w-4" />
                      Archiwum startów
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/participant?tab=orders')}>
                      <Package className="mr-2 h-4 w-4" />
                      Zamówienia
                    </DropdownMenuItem>
                  </>
                )}
                {user?.role === 'organizer' && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (location.pathname === '/organizer/events') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        navigate('/organizer/events');
                      }
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Zarządzaj wydarzeniami
                  </DropdownMenuItem>
                )}
                {user?.role === 'moderator' && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (location.pathname === '/moderator') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        navigate('/moderator');
                      }
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Panel moderacji
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Mój profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Button
                variant="ghost"
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link to="/logowanie">Zaloguj</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/rejestracja">Zarejestruj</Link>
              </Button>
            </div>
          )}
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          {totalItems > 0 && (
            <Link
              to="/cart"
              className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Koszyk"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            ref={menuButtonRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t border-border/60 bg-[hsl(var(--header-bg)/0.97)] lg:hidden"
        >
          <nav className="container flex flex-col gap-1 py-4">
            <Link
              to="/wydarzenia"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar className="h-4 w-4" />
              Kalendarz wydarzeń
            </Link>
            <Link
              to="/series"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Layers className="h-4 w-4" />
              Serie i cykle
            </Link>
            <Link
              to="/wyniki/live"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Radio className="h-4 w-4 text-destructive" />
              Wyniki na żywo
            </Link>
            <Link
              to="/challenges"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Flame className="h-4 w-4" />
              Wyzwania
            </Link>
            <Link
              to="/shop"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Trophy className="h-4 w-4" />
              Sklep
            </Link>

            <div className="my-2 border-t border-border/60" />

            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Panel {roleLabels[user?.role || 'participant']}
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Mój profil
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="mx-3 justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Wyloguj
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Button variant="outline" asChild>
                  <Link to="/logowanie" onClick={() => setMobileMenuOpen(false)}>
                    Zaloguj
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/rejestracja" onClick={() => setMobileMenuOpen(false)}>
                    Zarejestruj
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
