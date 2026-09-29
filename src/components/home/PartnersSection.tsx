import { safeUrl } from '@/lib/safeUrl';
import { SectionHeading } from '@/components/ui/section-heading';
import { PageSection } from '@/components/ui/page-section';
import { Handshake } from 'lucide-react';
import { Partner } from '@/types';

interface PartnersSectionProps {
  partners: Partner[];
}

export const PartnersSection = ({ partners }: PartnersSectionProps) => {
  const featuredPartners = partners.filter((p) => p.featured);

  if (featuredPartners.length === 0) return null;

  return (
    <PageSection muted>
      <SectionHeading
        title="Nasi partnerzy"
        subtitle="Współpracujemy z najlepszymi"
        accent="primary"
        action={
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {featuredPartners.map((partner) => (
          <a
            key={partner.id}
            href={safeUrl(partner.websiteUrl)}
            target="_blank"
            rel="noopener noreferrer"
            title={partner.name}
            className="group flex h-20 items-center justify-center rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-accent/50"
          >
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="max-h-10 max-w-full object-contain opacity-60 transition-all duration-200 group-hover:opacity-100"
            />
          </a>
        ))}
      </div>
    </PageSection>
  );
};
