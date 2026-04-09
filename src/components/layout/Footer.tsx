import { Link } from 'react-router-dom';
import {
  Timer,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Cookie,
  Mail,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { mockInfoPages } from '@/api/mock/cms.mock';

export const Footer = () => {
  const footerPages = mockInfoPages
    .filter((page) => page.published && page.showInFooter)
    .sort((a, b) => a.order - b.order);

  return (
    <footer className="mt-auto border-t border-border">
      <div className="bg-[hsl(0_0%_5%)]">
        <div className="container py-8 md:py-14">
          {/* Mobile: stacked layout / Desktop: 4-col grid */}
          <div className="flex flex-col gap-8 md:grid md:grid-cols-4 md:gap-8">
            {/* Logo & description — always full width on mobile */}
            <div className="space-y-3 md:col-span-1">
              <Link to="/" className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold tracking-tight text-foreground">
                  Zmierzymy<span className="text-primary">Czas</span>
                </span>
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Profesjonalna platforma do organizacji wydarzeń sportowych.
              </p>
              {/* Social icons — visible on mobile right under logo */}
              <div className="flex gap-3 pt-1 md:hidden">
                {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
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
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:mb-4">
                  Informacje
                </h4>
                <ul className="space-y-2 text-sm md:space-y-2.5">
                  {footerPages.map((page) => (
                    <li key={page.id}>
                      <Link
                        to={`/info/${page.slug}`}
                        className="group inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ChevronRight className="-ml-4 h-3 w-3 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100 md:hidden" />
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prawne */}
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:mb-4">
                  Prawne
                </h4>
                <ul className="space-y-2 text-sm md:space-y-2.5">
                  <li>
                    <Link
                      to="/info/regulamin"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Regulamin
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/info/polityka-prywatnosci"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Polityka prywatności
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/info/rodo"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      RODO
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:mb-4">
                Kontakt
              </h4>
              <ul className="mb-5 space-y-2.5 text-sm">
                <li>
                  <a
                    href="mailto:kontakt@zmierzymyczas.pl"
                    className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary/60" />
                    kontakt@zmierzymyczas.pl
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+48123456789"
                    className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary/60" />
                    +48 123 456 789
                  </a>
                </li>
              </ul>
              {/* Social icons — desktop only (mobile shown under logo) */}
              <div className="hidden gap-3 md:flex">
                {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                    aria-label={Icon.displayName}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-5 sm:flex-row md:mt-10 md:pt-6">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ZmierzymyCzas. Wszystkie prawa zastrzeżone.
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Made with</span>
              <span className="text-xs text-primary">♥</span>
              <span className="text-xs text-muted-foreground">for runners</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
