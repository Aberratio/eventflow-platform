import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { InfoPageSection } from '@/types';

interface CtaSectionProps {
  section: InfoPageSection;
}

export const CtaSection = ({ section }: CtaSectionProps) => {
  return (
    <section className="border-t-2 border-t-warning/30 bg-primary py-16 text-primary-foreground md:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-block h-1 w-12 rounded-full bg-warning" />
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">{section.title}</h2>
          {section.content && <p className="mb-8 text-lg opacity-90">{section.content}</p>}
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link to="/info/kontakt">Skontaktuj się</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <Link to="/wydarzenia">Zobacz wydarzenia</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
