import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { InfoPageSection } from '@/types';

interface FaqSectionProps {
  section: InfoPageSection;
}

export const FaqSection = ({ section }: FaqSectionProps) => {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          {section.title && (
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{section.title}</h2>
          )}
          <Accordion type="single" collapsible className="w-full">
            {section.items?.map((item, index) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.description}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
