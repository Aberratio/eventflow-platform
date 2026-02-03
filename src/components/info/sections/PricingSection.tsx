import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { InfoPageSection } from '@/types';

interface PricingSectionProps {
  section: InfoPageSection;
}

export const PricingSection = ({ section }: PricingSectionProps) => {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        {section.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{section.title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {section.items?.map((item, index) => (
            <Card
              key={item.id}
              className={index === 1 ? 'border-primary shadow-lg scale-105' : ''}
            >
              <CardHeader>
                <CardTitle className="text-center">{item.title}</CardTitle>
                {item.price !== undefined && (
                  <div className="text-center">
                    <span className="text-4xl font-bold">{item.price} zł</span>
                    <span className="text-muted-foreground">/mies.</span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center mb-4">{item.description}</p>
                {item.features && item.features.length > 0 && (
                  <ul className="space-y-2">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={index === 1 ? 'default' : 'outline'}>
                  Wybierz
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
