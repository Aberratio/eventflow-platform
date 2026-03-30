import { Link } from 'react-router-dom';
import { Timer, Facebook, Instagram, Youtube, Twitter, Cookie } from 'lucide-react';
import { mockInfoPages } from '@/data/mockData';

export const Footer = () => {
  const footerPages = mockInfoPages
    .filter(page => page.published && page.showInFooter)
    .sort((a, b) => a.order - b.order);

  return (
    <footer className="mt-auto border-t border-border">
      <div className="bg-[hsl(0_0%_5%)]">
        <div className="container py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Logo & description */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg tracking-tight text-foreground">
                  Zmierzymy<span className="text-primary">Czas</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Profesjonalna platforma do organizacji wydarzeń sportowych.
              </p>
            </div>
            
            {/* Wydarzenia */}
            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-muted-foreground">Wydarzenia</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/wydarzenia" className="text-muted-foreground hover:text-foreground transition-colors">Kalendarz</Link></li>
                <li><Link to="/wydarzenia?discipline=running" className="text-muted-foreground hover:text-foreground transition-colors">Bieganie</Link></li>
                <li><Link to="/wydarzenia?discipline=cycling" className="text-muted-foreground hover:text-foreground transition-colors">Kolarstwo</Link></li>
                <li><Link to="/wydarzenia?discipline=triathlon" className="text-muted-foreground hover:text-foreground transition-colors">Triathlon</Link></li>
              </ul>
            </div>
            
            {/* Informacje */}
            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-muted-foreground">Informacje</h4>
              <ul className="space-y-2.5 text-sm">
                {footerPages.map(page => (
                  <li key={page.id}>
                    <Link to={`/info/${page.slug}`} className="text-muted-foreground hover:text-foreground transition-colors">
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Prawne */}
            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-muted-foreground">Prawne</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/info/regulamin" className="text-muted-foreground hover:text-foreground transition-colors">Regulamin</Link></li>
                <li><Link to="/info/polityka-prywatnosci" className="text-muted-foreground hover:text-foreground transition-colors">Polityka prywatności</Link></li>
                <li><Link to="/info/rodo" className="text-muted-foreground hover:text-foreground transition-colors">RODO</Link></li>
                <li>
                  <button
                    onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 text-sm"
                  >
                    <Cookie className="h-3.5 w-3.5" />
                    Ustawienia cookies
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Kontakt & Social */}
            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-muted-foreground">Kontakt</h4>
              <ul className="space-y-2.5 text-sm mb-5">
                <li className="text-muted-foreground">kontakt@zmierzymyczs.pl</li>
                <li className="text-muted-foreground">+48 123 456 789</li>
              </ul>
              <div className="flex gap-3">
                {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                  <a key={i} href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label={Icon.displayName}>
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom row */}
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ZmierzymyCzas. Wszystkie prawa zastrzeżone.</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Made with</span>
              <span className="text-primary text-xs">♥</span>
              <span className="text-xs text-muted-foreground">for runners</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
