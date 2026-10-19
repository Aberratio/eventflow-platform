import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Trophy, Calendar, ChevronRight } from 'lucide-react';

export const HomeHero = () => {
  return (
    <section
      className="relative overflow-hidden py-16 md:py-24"
      style={{ backgroundColor: 'var(--page-bg)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'var(--overlay-gradient-blue)' }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent"
        style={{ backgroundImage: 'linear-gradient(to bottom, transparent, var(--page-bg))' }}
      />

      <div className="container relative z-10 mx-auto px-4">
        <div className="max-w-2xl">
          <Eyebrow className="mb-6">Platforma sportowa</Eyebrow>

          <h1 className="mb-6 text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Twoje sportowe
            <br />
            wydarzenia
            <br />w jednym miejscu
          </h1>

          <p className="mb-8 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            Odkrywaj zawody biegowe, rowerowe i triathlonowe. Rejestruj się, śledź wyniki na żywo i
            zdobywaj nowe rekordy.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link to="/events">
                <Calendar className="h-4 w-4" />
                Przeglądaj wydarzenia
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="gap-2">
              <Link to="/events?status=past">
                <Trophy className="h-4 w-4" />
                Sprawdź wyniki
              </Link>
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-6 border-t border-border pt-8">
            {[
              { value: '2.4k+', label: 'Wydarzeń' },
              { value: '180k+', label: 'Uczestników' },
              { value: '12+', label: 'Lat na rynku' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-6">
                {i > 0 && <div className="h-8 w-px bg-border" />}
                <div>
                  <div className="text-xl font-bold text-foreground md:text-2xl">{stat.value}</div>
                  <div className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
