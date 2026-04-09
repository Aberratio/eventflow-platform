import { InfoPageSection } from '@/types';
import { FileText } from 'lucide-react';

interface HeroSectionProps {
  section: InfoPageSection;
}

export const HeroSection = ({ section }: HeroSectionProps) => {
  return (
    <section className="border-b border-border/50 bg-gradient-to-b from-secondary/80 to-background py-10 md:py-16">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <FileText className="h-3.5 w-3.5" />
            Informacje
          </div>
          <h1 className="mb-3 text-2xl font-bold sm:text-3xl md:text-4xl">{section.title}</h1>
          {section.content && (
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-lg">
              {section.content}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
