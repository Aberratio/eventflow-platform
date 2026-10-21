import { safeUrl } from '@/lib/safeUrl';
import { useEffect, useState } from 'react';
import { deletePartner, getPartners } from '@/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Partner } from '@/types';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PartnersBannerPreviewProps {
  partners: Partner[];
  variant: 'light' | 'dark';
}

const PartnersBannerPreview = ({ partners, variant }: PartnersBannerPreviewProps) => {
  const isDark = variant === 'dark';

  return (
    <section
      className={
        isDark
          ? 'rounded-lg border border-neutral-800 bg-neutral-950 py-12 text-white md:py-16'
          : 'rounded-lg border bg-background py-12 md:py-16'
      }
    >
      <div className="mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Nasi partnerzy</h2>
          <p className={isDark ? 'mt-1 text-neutral-400' : 'mt-1 text-muted-foreground'}>
            Współpracujemy z najlepszymi
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {partners.map((partner) => {
            const logoUrl = isDark ? partner.logoDarkUrl || partner.logoUrl : partner.logoUrl;

            return (
              <a
                key={`${variant}-${partner.id}`}
                href={safeUrl(partner.websiteUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <Card
                  className={
                    isDark
                      ? 'h-full border-neutral-800 bg-neutral-900 transition-all duration-200 hover:border-neutral-500'
                      : 'h-full transition-all duration-200 hover:border-[hsl(var(--border-active))]'
                  }
                >
                  <CardContent className="flex h-24 items-center justify-center p-4">
                    <img
                      src={logoUrl}
                      alt={partner.name}
                      className="max-h-12 max-w-full object-contain opacity-40 transition-all duration-200 group-hover:opacity-80"
                    />
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const AdminPartnersTab = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const featuredPartners = partners.filter((partner) => partner.featured);

  useEffect(() => {
    let cancelled = false;

    getPartners()
      .then((response) => {
        if (!cancelled) setPartners(response.data);
      })
      .catch((error) => {
        if (!cancelled)
          toast.error(error instanceof Error ? error.message : 'Nie udało się pobrać partnerów');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDeletePartner = async (partner: Partner) => {
    try {
      await deletePartner(partner.id);
      setPartners((current) => current.filter((p) => p.id !== partner.id));
      toast.success(`Partner ${partner.name} został usunięty`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udało się usunąć partnera');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Partnerzy</h3>
          <p className="text-sm text-muted-foreground">
            Zarządzaj logotypami partnerów widocznymi na stronie głównej
          </p>
        </div>
        <Button onClick={() => navigate('/admin/partners/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj partnera
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Ładowanie partnerów...</p>
      ) : partners.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Brak partnerów w bazie.
          </CardContent>
        </Card>
      ) : (
        <>
          {featuredPartners.length > 0 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Podgląd banera na stronie głównej</h4>
                <p className="text-sm text-muted-foreground">
                  Widoczne sa tylko partnerzy oznaczeni jako wyroznieni.
                </p>
              </div>
              <PartnersBannerPreview partners={featuredPartners} variant="light" />
              <PartnersBannerPreview partners={featuredPartners} variant="dark" />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <Card key={partner.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="grid w-full grid-cols-1 gap-2">
                      <div className="flex h-20 w-full items-center justify-center rounded-lg bg-muted">
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          className="max-h-16 max-w-full object-contain"
                        />
                      </div>
                      {partner.logoDarkUrl && (
                        <div className="flex h-20 w-full items-center justify-center rounded-lg bg-neutral-950">
                          <img
                            src={partner.logoDarkUrl}
                            alt={`${partner.name} - logo na ciemne tło`}
                            className="max-h-16 max-w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{partner.name}</h4>
                      {safeUrl(partner.websiteUrl) && (
                        <a
                          href={safeUrl(partner.websiteUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Strona www
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {partner.featured ? (
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/10 text-primary"
                        >
                          Wyróżniony
                        </Badge>
                      ) : (
                        <Badge variant="outline">Ukryty</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/partners/${partner.id}/edit`)}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Edytuj
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeletePartner(partner)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
