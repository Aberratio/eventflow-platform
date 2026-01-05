import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Timer, Menu, X, User, LogOut, Calendar, Trophy, Settings, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

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
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Timer className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">SportTime</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/events" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Wydarzenia
          </Link>
          <Link to="/series" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Serie
          </Link>
          <Link to="/results" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Wyniki
          </Link>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <User className="h-4 w-4" />
                  <span>{user?.name}</span>
                  <Badge variant={roleBadgeVariants[user?.role || 'participant']}>
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
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/participant/events" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Moje zawody
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/participant/profile" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {(user?.role === 'organizer' || user?.role === 'admin') && (
                  <DropdownMenuItem asChild>
                    <Link to={`/${user.role}/events`} className="flex items-center gap-2">
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
            <Button asChild>
              <Link to="/login">Zaloguj się</Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-card">
          <nav className="container py-4 flex flex-col gap-4">
            <Link
              to="/events"
              className="text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Wydarzenia
            </Link>
            <Link
              to="/series"
              className="text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Serie
            </Link>
            <Link
              to="/results"
              className="text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Wyniki
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="text-sm font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Panel {roleLabels[user?.role || 'participant']}
                </Link>
                <Button variant="outline" onClick={handleLogout} className="justify-start">
                  <LogOut className="h-4 w-4 mr-2" />
                  Wyloguj
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Zaloguj się
                </Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
