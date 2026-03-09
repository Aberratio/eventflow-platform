import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthSafe } from '@/contexts/AuthContext';
import { useCartSafe } from '@/contexts/CartContext';
import { Timer, Menu, X, User, LogOut, Calendar, Settings, LayoutDashboard, ShoppingCart, ChevronDown, Radio, History, Package } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/NotificationCenter';
import { cn } from '@/lib/utils';

const roleLabels = {
  participant: 'Uczestnik',
  organizer: 'Organizator',
  moderator: 'Moderator',
  admin: 'Administrator',
};

const roleBadgeVariants = {
  participant: 'secondary',
  organizer: 'default',
  moderator: 'outline',
  admin: 'destructive',
} as const;

export const Header = () => {
  const auth = useAuthSafe();
  const { totalItems } = useCartSafe();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  
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
      case 'participant': return '/participant';
      case 'organizer': return '/organizer';
      case 'moderator': return '/moderator';
      case 'admin': return '/admin';
      default: return '/';
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isActivePrefix = (prefix: string) => location.pathname.startsWith(prefix);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Timer className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg tracking-tight text-foreground">
            Sport<span className="text-primary">Time</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "relative flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
              (isActive('/wydarzenia') || isActivePrefix('/wyniki') || isActivePrefix('/series') || isActivePrefix('/events'))
                ? "text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full"
                : "text-muted-foreground"
            )}>
              Wydarzenia
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/wydarzenia" className="w-full">Kalendarz</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/series" className="w-full">Serie i cykle</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/wyniki/live" className="w-full flex items-center gap-2">
                  <Radio className="h-3 w-3 text-destructive" />
                  Wyniki na żywo
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link 
            to="/challenges" 
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
              isActivePrefix('/challenges')
                ? "text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full"
                : "text-muted-foreground"
            )}
          >
            Wyzwania
          </Link>

          <Link 
            to="/sklep" 
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
              (isActive('/sklep') || isActive('/shop'))
                ? "text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full"
                : "text-muted-foreground"
            )}
          >
            Sklep
          </Link>

          <div className="w-px h-5 bg-border mx-1" />

          <Link to="/cart" className="relative p-2 rounded-md hover:bg-accent transition-colors" aria-label="Koszyk">
            <ShoppingCart className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold leading-none">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated && <NotificationCenter />}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 ml-2 text-muted-foreground hover:text-foreground">
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{user?.name}</span>
                  <Badge variant={roleBadgeVariants[user?.role || 'participant']} className="text-xs">
                    {roleLabels[user?.role || 'participant']}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => {
                  const target = getDashboardLink();
                  if (location.pathname === target) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate(target);
                  }
                }}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Panel
                </DropdownMenuItem>
                {user?.role === 'participant' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/participant?tab=registrations')}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Nadchodzące starty
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/participant?tab=history')}>
                      <History className="h-4 w-4 mr-2" />
                      Archiwum startów
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/participant?tab=orders')}>
                      <Package className="h-4 w-4 mr-2" />
                      Zamówienia
                    </DropdownMenuItem>
                  </>
                )}
                {user?.role === 'organizer' && (
                  <DropdownMenuItem onClick={() => {
                    if (location.pathname === '/organizer/events') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      navigate('/organizer/events');
                    }
                  }}>
                    <Settings className="h-4 w-4 mr-2" />
                    Zarządzaj wydarzeniami
                  </DropdownMenuItem>
                )}
                {user?.role === 'moderator' && (
                  <DropdownMenuItem onClick={() => {
                    if (location.pathname === '/moderator') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      navigate('/moderator');
                    }
                  }}>
                    <Settings className="h-4 w-4 mr-2" />
                    Panel moderacji
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Mój profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/logowanie">Zaloguj</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/rejestracja">Zarejestruj</Link>
              </Button>
            </div>
          )}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="container py-4 flex flex-col gap-1">
            <Link to="/wydarzenia" className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              Wydarzenia
            </Link>

            <Collapsible open={resultsOpen} onOpenChange={setResultsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
                Wyniki
                <ChevronDown className={cn("h-4 w-4 transition-transform", resultsOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4">
                <Link to="/wydarzenia" className="block px-3 py-2 text-sm text-muted-foreground rounded-md hover:text-foreground hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  Kalendarz
                </Link>
                <Link to="/series" className="block px-3 py-2 text-sm text-muted-foreground rounded-md hover:text-foreground hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  Serie i cykle
                </Link>
                <Link to="/wyniki/live" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-md hover:text-foreground hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <Radio className="h-3 w-3 text-destructive" />
                  Wyniki na żywo
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Link to="/challenges" className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              Wyzwania
            </Link>
            <Link to="/sklep" className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              Sklep
            </Link>
            <Link to="/cart" className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <ShoppingCart className="h-4 w-4" />
              Koszyk
              {totalItems > 0 && <Badge variant="secondary">{totalItems}</Badge>}
            </Link>

            <div className="border-t border-border my-2" />

            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  Panel {roleLabels[user?.role || 'participant']}
                </Link>
                <Link to="/profile" className="px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <User className="h-4 w-4" />
                  Mój profil
                </Link>
                <Button variant="outline" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="justify-start mx-3">
                  <LogOut className="h-4 w-4 mr-2" />
                  Wyloguj
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Button variant="outline" asChild>
                  <Link to="/logowanie" onClick={() => setMobileMenuOpen(false)}>Zaloguj</Link>
                </Button>
                <Button asChild>
                  <Link to="/rejestracja" onClick={() => setMobileMenuOpen(false)}>Zarejestruj</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
