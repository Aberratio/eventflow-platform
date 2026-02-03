import { InfoPageSection } from '@/types';

interface StatsSectionProps {
  section: InfoPageSection;
}

export const StatsSection = ({ section }: StatsSectionProps) => {
  return (
    <section className="py-12 md:py-16 bg-muted/50">
      <div className="container">
        {section.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{section.title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {section.items?.map((item) => (
            <div key={item.id} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {item.title}
              </div>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
