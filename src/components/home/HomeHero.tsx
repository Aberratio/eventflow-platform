import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, ChevronRight } from 'lucide-react';

export const HomeHero = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-[hsl(0_0%_5%)]">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-10 bg-primary" />
            <span className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">Platforma sportowa</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.08] text-foreground">
            Twoje sportowe<br />
            wydarzenia<br />
            w jednym miejscu
          </h1>

          <p className="text-base md:text-lg mb-8 max-w-lg leading-relaxed text-muted-foreground">
            Odkrywaj zawody biegowe, rowerowe i triathlonowe. Rejestruj się, śledź wyniki na żywo i zdobywaj nowe rekordy.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to="/events">
                <Calendar className="h-4 w-4" />
                Przeglądaj wydarzenia
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="gap-2">
              <Link to="/results">
                <Trophy className="h-4 w-4" />
                Sprawdź wyniki
              </Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-10 pt-8 border-t border-border">
            {[
              { value: '2.4k+', label: 'Wydarzeń' },
              { value: '180k+', label: 'Uczestników' },
              { value: '12+', label: 'Lat na rynku' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-6">
                {i > 0 && <div className="w-px h-8 bg-border" />}
                <div>
                  <div className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-widest font-medium mt-0.5 text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
