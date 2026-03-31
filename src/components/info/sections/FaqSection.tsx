import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { InfoPageSection } from '@/types';
import { HelpCircle } from 'lucide-react';

interface FaqSectionProps {
  section: InfoPageSection;
}

export const FaqSection = ({ section }: FaqSectionProps) => {
  return (
    <section className="py-8 md:py-12">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          {section.title && (
            <div className="flex items-center justify-center gap-2.5 mb-8">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold text-center">{section.title}</h2>
            </div>
          )}
          <Card className="p-2 md:p-4">
            <Accordion type="single" collapsible className="w-full">
              {section.items?.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-border/50">
                  <AccordionTrigger className="text-left text-sm md:text-base px-2 hover:no-underline">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm px-2 leading-relaxed">
                    {item.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </div>
    </section>
  );
};
