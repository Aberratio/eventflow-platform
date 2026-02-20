import { Link } from 'react-router-dom';
import { Timer, Facebook, Instagram, Youtube, Twitter, Cookie } from 'lucide-react';
import { mockInfoPages } from '@/data/mockData';

export const Footer = () => {
  // Get only published pages that should show in footer
  const footerPages = mockInfoPages
    .filter(page => page.published && page.showInFooter)
    .sort((a, b) => a.order - b.order);

  return (
    <footer className="mt-auto">
      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      {/* Main footer — dark */}
      <div style={{ backgroundColor: '#111111', color: '#f5f5f5' }}>
        <div className="container py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Logo & description */}
            <div className="col-span-2 md:col-span-1 space-y-4">
              <Link to="/" className="flex items-center gap-2 group">
                <Timer className="h-5 w-5 text-primary transition-transform group-hover:rotate-12 duration-300" />
                <span className="font-bold text-lg tracking-tight">
                  Sport<span className="text-primary">Time</span>
                </span>
              </Link>
              <p className="text-sm opacity-50 leading-relaxed">
                Profesjonalna platforma do organizacji wydarzeń sportowych.
              </p>
            </div>
            
            {/* Wydarzenia */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-40">Wydarzenia</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/wydarzenia" className="opacity-60 hover:opacity-100 hover:text-primary transition-all">Kalendarz</Link></li>
                <li><Link to="/wydarzenia?discipline=running" className="opacity-60 hover:opacity-100 hover:text-primary transition-all">Bieganie</Link></li>
                <li><Link to="/wydarzenia?discipline=cycling" className="opacity-60 hover:opacity-100 hover:text-primary transition-all">Kolarstwo</Link></li>
                <li><Link to="/wydarzenia?discipline=triathlon" className="opacity-60 hover:opacity-100 hover:text-primary transition-all">Triathlon</Link></li>
              </ul>
            </div>
            
            {/* Informacje - Dynamic from CMS */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-40">Informacje</h4>
              <ul className="space-y-2.5 text-sm">
                {footerPages.map(page => (
                  <li key={page.id}>
                    <Link to={`/info/${page.slug}`} className="opacity-60 hover:opacity-100 hover:text-primary transition-all">
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Prawne */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-40">Prawne</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/info/regulamin" className="opacity-60 hover:opacity-100 hover:text-primary transition-all">Regulamin</Link></li>
                <li><Link to="/info/polityka-prywatnosci" className="opacity-60 hover:opacity-100 hover:text-primary transition-all">Polityka prywatności</Link></li>
                <li><Link to="/info/rodo" className="opacity-60 hover:opacity-100 hover:text-primary transition-all">RODO</Link></li>
                <li>
                  <button
                    onClick={() => window.dispatchEvent(new Event('open-cookie-settings'))}
                    className="opacity-60 hover:opacity-100 hover:text-primary transition-all inline-flex items-center gap-1.5 text-sm"
                  >
                    <Cookie className="h-3.5 w-3.5" />
                    Ustawienia cookies
                  </button>
                </li>
              </ul>
            </div>
            
            {/* Kontakt & Social */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-40">Kontakt</h4>
              <ul className="space-y-2.5 text-sm mb-5">
                <li className="opacity-60">kontakt@sporttime.pl</li>
                <li className="opacity-60">+48 123 456 789</li>
              </ul>
              <div className="flex gap-3">
                <a href="#" className="opacity-40 hover:opacity-100 hover:text-primary transition-all" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="opacity-40 hover:opacity-100 hover:text-primary transition-all" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="opacity-40 hover:opacity-100 hover:text-primary transition-all" aria-label="Youtube">
                  <Youtube className="h-5 w-5" />
                </a>
                <a href="#" className="opacity-40 hover:opacity-100 hover:text-primary transition-all" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Bottom row */}
          <div className="mt-10 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm opacity-40">© {new Date().getFullYear()} SportTime. Wszystkie prawa zastrzeżone.</p>
            <div className="flex items-center gap-1">
              <span className="text-xs opacity-30">Made with</span>
              <span className="text-primary text-xs">♥</span>
              <span className="text-xs opacity-30">for runners</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};