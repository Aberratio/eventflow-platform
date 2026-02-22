import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { InfoPageSection } from '@/types';

interface CtaSectionProps {
  section: InfoPageSection;
}

export const CtaSection = ({ section }: CtaSectionProps) => {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground border-t-2 border-t-warning/30">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block h-1 w-12 bg-warning rounded-full mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{section.title}</h2>
          {section.content && (
            <p className="text-lg opacity-90 mb-8">{section.content}</p>
          )}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/info/kontakt">Skontaktuj się</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/wydarzenia">Zobacz wydarzenia</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
