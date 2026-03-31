import { InfoPageSection } from '@/types';

interface StatsSectionProps {
  section: InfoPageSection;
}

export const StatsSection = ({ section }: StatsSectionProps) => {
  return (
    <section className="py-8 md:py-12 bg-muted/40">
      <div className="container">
        {section.title && (
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">{section.title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
          {section.items?.map((item) => (
            <div key={item.id} className="text-center p-4 rounded-lg bg-background/60">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1">
                {item.title}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
