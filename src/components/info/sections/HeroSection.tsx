import { InfoPageSection } from '@/types';

interface HeroSectionProps {
  section: InfoPageSection;
}

export const HeroSection = ({ section }: HeroSectionProps) => {
  return (
    <section className="bg-gradient-to-b from-secondary to-background py-16 md:py-24 border-b-2 border-b-warning/20">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block h-1 w-12 bg-warning rounded-full mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{section.title}</h1>
          {section.content && (
            <p className="text-xl text-muted-foreground">{section.content}</p>
          )}
        </div>
      </div>
    </section>
  );
};
