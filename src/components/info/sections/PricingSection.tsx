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
          <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">{section.title}</h2>
        )}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {section.items?.map((item, index) => (
            <Card key={item.id} className={index === 1 ? 'scale-105 border-primary shadow-lg' : ''}>
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
                <p className="mb-4 text-center text-muted-foreground">{item.description}</p>
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
