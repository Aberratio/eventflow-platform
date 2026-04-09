import { Card, CardContent } from '@/components/ui/card';
import { Partner } from '@/types';

interface PartnersSectionProps {
  partners: Partner[];
}

export const PartnersSection = ({ partners }: PartnersSectionProps) => {
  const featuredPartners = partners.filter((p) => p.featured);

  if (featuredPartners.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Nasi partnerzy</h2>
          <p className="mt-1 text-muted-foreground">Współpracujemy z najlepszymi</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {featuredPartners.map((partner) => (
            <a
              key={partner.id}
              href={partner.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <Card className="h-full transition-all duration-200 hover:border-[hsl(var(--border-active))]">
                <CardContent className="flex h-24 items-center justify-center p-4">
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
