import { Card, CardContent } from '@/components/ui/card';
import { Partner } from '@/types';

interface PartnersSectionProps {
  partners: Partner[];
}

export const PartnersSection = ({ partners }: PartnersSectionProps) => {
  const featuredPartners = partners.filter(p => p.featured);

  if (featuredPartners.length === 0) return null;

  return (
    <section className="py-12 md:py-16 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Nasi partnerzy</h2>
          <p className="text-muted-foreground mt-1">Współpracujemy z najlepszymi</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {featuredPartners.map(partner => (
            <a
              key={partner.id}
              href={partner.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="transition-all duration-200 hover:border-[hsl(var(--border-active))] h-full">
                <CardContent className="p-4 flex items-center justify-center h-24">
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="max-h-12 max-w-full object-contain opacity-40 transition-all duration-200 group-hover:opacity-80"
                  />
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
