import { InfoPageSection } from '@/types';
import { PageSection } from '@/components/ui/page-section';

interface StatsSectionProps {
  section: InfoPageSection;
}

export const StatsSection = ({ section }: StatsSectionProps) => {
  return (
    <PageSection compact muted>
      {section.title && (
        <h2 className="mb-6 text-center text-xl font-bold md:text-2xl">{section.title}</h2>
      )}
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
        {section.items?.map((item) => (
          <div key={item.id} className="rounded-lg bg-background/60 p-4 text-center">
            <div className="mb-1 text-2xl font-bold text-primary sm:text-3xl md:text-4xl">
              {item.title}
            </div>
            <p className="text-xs text-muted-foreground md:text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </PageSection>
  );
};
