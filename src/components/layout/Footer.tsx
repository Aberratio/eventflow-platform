import { Link } from 'react-router-dom';
import { Timer, Facebook, Instagram, Youtube, Twitter, Cookie, Mail, Phone, ChevronRight } from 'lucide-react';
import { mockInfoPages } from '@/api/mock/cms.mock';

export const Footer = () => {
  const footerPages = mockInfoPages
    .filter(page => page.published && page.showInFooter)
    .sort((a, b) => a.order - b.order);

  return (
    <footer className="mt-auto border-t border-border">
      <div className="bg-[hsl(0_0%_5%)]">
        <div className="container py-8 md:py-14">
          {/* Mobile: stacked layout / Desktop: 4-col grid */}
          <div className="flex flex-col md:grid md:grid-cols-4 gap-8 md:gap-8">
            
            {/* Logo & description — always full width on mobile */}
            <div className="space-y-3 md:col-span-1">
              <Link to="/" className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg tracking-tight text-foreground">
                  Zmierzymy<span className="text-primary">Czas</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Profesjonalna platforma do organizacji wydarzeń sportowych.
              </p>
              {/* Social icons — visible on mobile right under logo */}
              <div className="flex gap-3 pt-1 md:hidden">
                {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    aria-label={Icon.displayName}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links columns — 2-col grid on mobile */}
            <div className="grid grid-cols-2 gap-6 md:contents">
              {/* Informacje */}
              <div>
                <h4 className="font-semibold mb-3 md:mb-4 text-xs uppercase tracking-wider text-muted-foreground">
                  Informacje
                </h4>
                <ul className="space-y-2 md:space-y-2.5 text-sm">
                  {footerPages.map(page => (
                    <li key={page.id}>
                      <Link
                        to={`/info/${page.slug}`}
                        className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                      >
                        <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all md:hidden" />
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prawne */}
              <div>
                <h4 className="font-semibold mb-3 md:mb-4 text-xs uppercase tracking-wider text-muted-foreground">
                  Prawne
                </h4>
                <ul className="space-y-2 md:space-y-2.5 text-sm">
                  <li>
                    <Link to="/info/regulamin" className="text-muted-foreground hover:text-foreground transition-colors">
                      Regulamin
                    </Link>
                  </li>
                  <li>
                    <Link to="/info/polityka-prywatnosci" className="text-muted-foreground hover:text-foreground transition-colors">
                      Polityka prywatności
                    </Link>
                  </li>
                  <li>
                    <Link to="/info/rodo" className="text-muted-foreground hover:text-foreground transition-colors">
                      RODO
                    </Link>
                  </li>
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
            </div>

            {/* Kontakt & Social */}
            <div>
              <h4 className="font-semibold mb-3 md:mb-4 text-xs uppercase tracking-wider text-muted-foreground">
                Kontakt
              </h4>
              <ul className="space-y-2.5 text-sm mb-5">
                <li>
                  <a href="mailto:kontakt@zmierzymyczas.pl" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary/60" />
                    kontakt@zmierzymyczas.pl
                  </a>
                </li>
                <li>
                  <a href="tel:+48123456789" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-primary/60" />
                    +48 123 456 789
                  </a>
                </li>
              </ul>
              {/* Social icons — desktop only (mobile shown under logo) */}
              <div className="hidden md:flex gap-3">
                {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="h-8 w-8 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    aria-label={Icon.displayName}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-8 md:mt-10 pt-5 md:pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ZmierzymyCzas. Wszystkie prawa zastrzeżone.
            </p>
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
