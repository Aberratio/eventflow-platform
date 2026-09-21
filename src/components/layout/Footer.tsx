import { getInfoPages } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Timer, Facebook, Instagram, Youtube, Twitter, Cookie, Mail, Phone } from 'lucide-react';

export const Footer = () => {
  const { data: pagesResp } = useQuery({
    queryKey: ['info-pages'],
    queryFn: getInfoPages,
    staleTime: 10 * 60 * 1000,
    select: (r) => r.data ?? [],
  });

  const footerPages = (pagesResp ?? [])
    .filter((page) => page.published && page.showInFooter)
    .sort((a, b) => a.order - b.order);

  return (
    <footer
      className="border-white/8 mt-auto border-t bg-[#070b12]"
      style={{ containIntrinsicSize: '0 260px', contentVisibility: 'auto' }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:grid md:grid-cols-4 md:gap-10">
          {/* Logo & description */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <Timer className="h-4.5 w-4.5 text-primary" />
              <span className="text-base font-bold tracking-tight text-white">
                Zmierzmy<span className="text-primary">Czas</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/40">
              Profesjonalna platforma do organizacji wydarzeń sportowych.
            </p>
            <div className="flex gap-2 pt-0.5 md:hidden">
              {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-7 w-7 items-center justify-center rounded text-white/35 transition hover:text-white/65"
                  aria-label={Icon.displayName}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-6 md:contents">
            {/* Informacje */}
            <div>
              <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Informacje
              </h4>
              <ul className="space-y-2.5 text-sm">
                {footerPages.map((page) => (
                  <li key={page.id}>
                    <Link
                      to={`/info/${page.slug}`}
                      className="text-white/50 transition-colors hover:text-white/80"
                    >
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prawne */}
            <div>
              <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Prawne
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/info/regulamin"
                    className="text-white/50 transition-colors hover:text-white/80"
                  >
                    Regulamin
                  </Link>
                </li>
                <li>
                  <Link
                    to="/info/polityka-prywatnosci"
                    className="text-white/50 transition-colors hover:text-white/80"
                  >
                    Polityka prywatności
                  </Link>
                </li>
                <li>
                  <Link
                    to="/info/rodo"
                    className="text-white/50 transition-colors hover:text-white/80"
                  >
                    RODO
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                    className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white/80"
                  >
                    <Cookie className="h-3 w-3" />
                    Ustawienia cookies
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Kontakt & Social */}
          <div>
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Kontakt
            </h4>
            <ul className="mb-5 space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:kontakt@zmierzymyczas.pl"
                  className="inline-flex items-center gap-2 text-white/50 transition-colors hover:text-white/80"
                >
                  <Mail className="h-3 w-3" />
                  kontakt@zmierzymyczas.pl
                </a>
              </li>
              <li>
                <a
                  href="tel:+48123456789"
                  className="inline-flex items-center gap-2 text-white/50 transition-colors hover:text-white/80"
                >
                  <Phone className="h-3 w-3" />
                  +48 123 456 789
                </a>
              </li>
            </ul>
            <div className="hidden gap-2 md:flex">
              {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-7 w-7 items-center justify-center rounded text-white/30 transition hover:text-white/60"
                  aria-label={Icon.displayName}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-white/8 mt-8 flex flex-col items-center justify-between gap-2 border-t pt-5 sm:flex-row">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} ZmierzymyCzas. Wszystkie prawa zastrzeżone.
          </p>
          <p className="text-xs text-white/20">
            Made with <span className="text-primary/60">♥</span> for runners
          </p>
        </div>
      </div>
    </footer>
  );
};
