import { Link } from 'react-router-dom';
import { Timer } from 'lucide-react';
import { ContactAdminForm } from '@/components/ContactAdminForm';

export const Footer = () => {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Timer className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">SportTime</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Profesjonalna platforma do organizacji i pomiaru czasu wydarzeń sportowych.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Wydarzenia</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/events?discipline=running" className="hover:text-foreground transition-colors">Bieganie</Link></li>
              <li><Link to="/events?discipline=cycling" className="hover:text-foreground transition-colors">Kolarstwo</Link></li>
              <li><Link to="/events?discipline=triathlon" className="hover:text-foreground transition-colors">Triathlon</Link></li>
              <li><Link to="/events?discipline=multisport" className="hover:text-foreground transition-colors">Multisport</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Dla organizatorów</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Panel organizatora</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Cennik</Link></li>
              <li><Link to="#" className="hover:text-foreground transition-colors">Pomiar czasu</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>kontakt@sporttime.pl</li>
              <li>+48 123 456 789</li>
              <li className="pt-2">
                <ContactAdminForm />
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SportTime. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
};
