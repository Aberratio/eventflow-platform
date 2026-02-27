import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { mockPartners } from '@/data/mockData';
import { Partner } from '@/types';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const AdminPartnersTab = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>(mockPartners);

  const handleDeletePartner = (partner: Partner) => {
    setPartners(partners.filter((p) => p.id !== partner.id));
    toast.success(`Partner ${partner.name} został usunięty`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Partnerzy</h3>
          <p className="text-sm text-muted-foreground">
            Zarządzaj logotypami partnerów widocznymi na stronie głównej
          </p>
        </div>
        <Button onClick={() => navigate('/admin/partners/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj partnera
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => (
          <Card key={partner.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-full h-20 flex items-center justify-center bg-muted rounded-lg">
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="max-h-16 max-w-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-medium">{partner.name}</h4>
                  {partner.websiteUrl && (
                    <a
                      href={partner.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Strona www
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {partner.featured ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Wyróżniony
                    </Badge>
                  ) : (
                    <Badge variant="outline">Ukryty</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/partners/${partner.id}/edit`)}>
                    <Pencil className="h-4 w-4 mr-1" />
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
    </div>
  );
};
