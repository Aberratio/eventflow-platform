import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Timer, Menu, X, User, LogOut, Calendar, Settings, LayoutDashboard, ShoppingCart, ChevronDown, Radio } from 'lucide-react';
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
  admin: 'Administrator',
};

const roleBadgeVariants = {
  participant: 'secondary',
  organizer: 'default',
  admin: 'destructive',
} as const;

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'participant': return '/participant';
      case 'organizer': return '/organizer';
      case 'admin': return '/admin';
      default: return '/';
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isActivePrefix = (prefix: string) => location.pathname.startsWith(prefix);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Timer className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">SportTime</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link 
            to="/" 
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive('/') && "bg-accent text-accent-foreground"
            )}
          >
            Strona Główna
          </Link>

          <Link 
            to="/wydarzenia" 
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
              (isActive('/wydarzenia') || isActive('/events')) && "bg-accent text-accent-foreground"
            )}
          >
            Wydarzenia
          </Link>

          {/* Wyniki dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
              isActivePrefix('/wyniki') && "bg-accent text-accent-foreground"
            )}>
              Wyniki
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/wyniki" className="w-full">
                  Kalendarz wyników
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/wyniki/live" className="w-full flex items-center gap-2">
                  <Radio className="h-3 w-3 text-destructive" />
                  Na żywo
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


          {/* Informacje dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
              isActivePrefix('/info') && "bg-accent text-accent-foreground"
            )}>
              Informacje
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/info/kontakt" className="w-full">Kontakt</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/info/oferta" className="w-full">Oferta</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/info/ubezpieczenia" className="w-full">Ubezpieczenia</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/info/o-nas" className="w-full">O nas</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link 
            to="/sklep" 
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
              (isActive('/sklep') || isActive('/shop')) && "bg-accent text-accent-foreground"
            )}
          >
            Sklep
          </Link>

          {/* Cart */}
          <Link to="/cart" className="relative p-2" aria-label="Koszyk">
            <ShoppingCart className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated && <NotificationCenter />}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 ml-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{user?.name}</span>
                  <Badge variant={roleBadgeVariants[user?.role || 'participant']} className="text-xs">
                    {roleLabels[user?.role || 'participant']}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={getDashboardLink()} className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Panel
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'participant' && (
                  <DropdownMenuItem asChild>
                    <Link to="/participant/events" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Moje zawody
                    </Link>
                  </DropdownMenuItem>
                )}
                {user?.role === 'organizer' && (
                  <DropdownMenuItem asChild>
                    <Link to="/organizer/events" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Zarządzaj wydarzeniami
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Wyloguj
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Button variant="ghost" asChild>
                <Link to="/logowanie">Zaloguj</Link>
              </Button>
              <Button asChild>
                <Link to="/rejestracja">Zarejestruj</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
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
        <div className="lg:hidden border-t bg-card max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="container py-4 flex flex-col gap-1">
            <Link to="/" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              Strona Główna
            </Link>
            <Link to="/wydarzenia" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              Wydarzenia
            </Link>

            <Collapsible open={resultsOpen} onOpenChange={setResultsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent">
                Wyniki
                <ChevronDown className={cn("h-4 w-4 transition-transform", resultsOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4">
                <Link to="/wyniki" className="block px-3 py-2 text-sm rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  Kalendarz wyników
                </Link>
                <Link to="/wyniki/live" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  <Radio className="h-3 w-3 text-destructive" />
                  Na żywo
                </Link>
              </CollapsibleContent>
            </Collapsible>


            <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent">
                Informacje
                <ChevronDown className={cn("h-4 w-4 transition-transform", infoOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4">
                <Link to="/info/kontakt" className="block px-3 py-2 text-sm rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  Kontakt
                </Link>
                <Link to="/info/oferta" className="block px-3 py-2 text-sm rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  Oferta
                </Link>
                <Link to="/info/ubezpieczenia" className="block px-3 py-2 text-sm rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  Ubezpieczenia
                </Link>
                <Link to="/info/o-nas" className="block px-3 py-2 text-sm rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  O nas
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Link to="/sklep" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              Sklep
            </Link>
            <Link to="/cart" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <ShoppingCart className="h-4 w-4" />
              Koszyk
              {totalItems > 0 && <Badge variant="secondary">{totalItems}</Badge>}
            </Link>

            <div className="border-t my-2" />

            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  Panel {roleLabels[user?.role || 'participant']}
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