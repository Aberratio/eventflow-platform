import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
        <div className="mx-auto max-w-3xl">
          {section.title && (
            <div className="mb-8 flex items-center justify-center gap-2.5">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h2 className="text-center text-xl font-bold md:text-2xl">{section.title}</h2>
            </div>
          )}
          <Card className="p-2 md:p-4">
            <Accordion type="single" collapsible className="w-full">
              {section.items?.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-border/50">
                  <AccordionTrigger className="px-2 text-left text-sm hover:no-underline md:text-base">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="px-2 text-sm leading-relaxed text-muted-foreground">
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
