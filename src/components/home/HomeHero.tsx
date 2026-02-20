import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, ChevronRight } from 'lucide-react';

export const HomeHero = () => {
  return (
    <section
      className="relative overflow-hidden py-16 md:py-24"
      style={{ backgroundColor: '#141414' }}
    >
      {/* Red accent shapes */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-8 right-16 w-48 h-48 bg-primary/8 rounded-full blur-2xl pointer-events-none" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          {/* Eyebrow label */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-10 bg-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-[0.2em]">Platforma sportowa</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.08]"
              style={{ color: 'hsl(0 0% 98%)' }}>
            Twoje sportowe<br />
            <span className="text-primary">wydarzenia</span><br />
            w jednym miejscu
          </h1>

          <p className="text-base md:text-lg mb-8 max-w-lg leading-relaxed"
             style={{ color: 'hsl(0 0% 60%)' }}>
            Odkrywaj zawody biegowe, rowerowe i triathlonowe. Rejestruj się, śledź wyniki na żywo i zdobywaj nowe rekordy.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 font-semibold">
              <Link to="/events">
                <Calendar className="h-4 w-4" />
                Przeglądaj wydarzenia
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="gap-2 font-medium"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'hsl(0 0% 90%)',
              }}
            >
              <Link to="/results">
                <Trophy className="h-4 w-4" />
                Sprawdź wyniki
              </Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-10 pt-8"
               style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { value: '2.4k+', label: 'Wydarzeń' },
              { value: '180k+', label: 'Uczestników' },
              { value: '12+', label: 'Lat na rynku' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-6">
                {i > 0 && <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />}
                <div>
                  <div className="text-xl md:text-2xl font-bold" style={{ color: 'hsl(0 0% 96%)' }}>{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-widest font-medium mt-0.5" style={{ color: 'hsl(0 0% 40%)' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
