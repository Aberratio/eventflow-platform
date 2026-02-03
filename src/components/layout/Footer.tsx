import { Link } from 'react-router-dom';
import { Timer, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import { mockInfoPages } from '@/data/mockData';

export const Footer = () => {
  // Get only published pages that should show in footer
  const footerPages = mockInfoPages
    .filter(page => page.published && page.showInFooter)
    .sort((a, b) => a.order - b.order);

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo & description */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Timer className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">SportTime</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Profesjonalna platforma do organizacji wydarzeń sportowych.
            </p>
          </div>
          
          {/* Wydarzenia */}
          <div>
            <h4 className="font-semibold mb-4">Wydarzenia</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/wydarzenia" className="hover:text-foreground transition-colors">Kalendarz</Link></li>
              <li><Link to="/wydarzenia?discipline=running" className="hover:text-foreground transition-colors">Bieganie</Link></li>
              <li><Link to="/wydarzenia?discipline=cycling" className="hover:text-foreground transition-colors">Kolarstwo</Link></li>
              <li><Link to="/wydarzenia?discipline=triathlon" className="hover:text-foreground transition-colors">Triathlon</Link></li>
            </ul>
          </div>
          
          {/* Informacje - Dynamic from CMS */}
          <div>
            <h4 className="font-semibold mb-4">Informacje</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerPages.map(page => (
                <li key={page.id}>
                  <Link to={`/info/${page.slug}`} className="hover:text-foreground transition-colors">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Prawne */}
          <div>
            <h4 className="font-semibold mb-4">Prawne</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/info/regulamin" className="hover:text-foreground transition-colors">Regulamin</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Polityka prywatności</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">RODO</Link></li>
            </ul>
          </div>
          
          {/* Kontakt & Social */}
          <div>
            <h4 className="font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li>kontakt@sporttime.pl</li>
              <li>+48 123 456 789</li>
            </ul>
            <div className="flex gap-3">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Youtube">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SportTime. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
};