import { InfoPageSection } from '@/types';
import { FileText } from 'lucide-react';

interface HeroSectionProps {
  section: InfoPageSection;
}

export const HeroSection = ({ section }: HeroSectionProps) => {
  return (
    <section className="bg-gradient-to-b from-secondary/80 to-background py-10 md:py-16 border-b border-border/50">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5">
            <FileText className="h-3.5 w-3.5" />
            Informacje
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">{section.title}</h1>
          {section.content && (
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">{section.content}</p>
          )}
        </div>
      </div>
    </section>
  );
};
