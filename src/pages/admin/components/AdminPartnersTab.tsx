import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { mockPartners } from '@/data/mockData';
import { Partner } from '@/types';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const AdminPartnersTab = () => {
  const [partners, setPartners] = useState<Partner[]>(mockPartners);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    websiteUrl: '',
    featured: true,
  });

  const handleAddPartner = () => {
    const newPartner: Partner = {
      id: `partner${Date.now()}`,
      name: formData.name,
      logoUrl: formData.logoUrl,
      websiteUrl: formData.websiteUrl,
      featured: formData.featured,
    };
    setPartners([...partners, newPartner]);
    toast.success(`Partner ${formData.name} został dodany`);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditPartner = () => {
    if (!editingPartner) return;
    setPartners(
      partners.map((p) =>
        p.id === editingPartner.id
          ? { ...p, ...formData }
          : p
      )
    );
    toast.success(`Partner ${formData.name} został zaktualizowany`);
    resetForm();
    setEditingPartner(null);
  };

  const handleDeletePartner = (partner: Partner) => {
    setPartners(partners.filter((p) => p.id !== partner.id));
    toast.success(`Partner ${partner.name} został usunięty`);
  };

  const resetForm = () => {
    setFormData({ name: '', logoUrl: '', websiteUrl: '', featured: true });
  };

  const openEditDialog = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logoUrl: partner.logoUrl,
      websiteUrl: partner.websiteUrl || '',
      featured: partner.featured,
    });
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj partnera
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj nowego partnera</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nazwa partnera</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nazwa firmy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL logotypu</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Strona internetowa</Label>
                <Input
                  id="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Wyświetlaj na stronie głównej</Label>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
              </div>
              <Button onClick={handleAddPartner} className="w-full">
                Dodaj partnera
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                  <Dialog
                    open={editingPartner?.id === partner.id}
                    onOpenChange={(open) => {
                      if (!open) setEditingPartner(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(partner)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edytuj
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edytuj partnera</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Nazwa partnera</Label>
                          <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-logoUrl">URL logotypu</Label>
                          <Input
                            id="edit-logoUrl"
                            value={formData.logoUrl}
                            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-websiteUrl">Strona internetowa</Label>
                          <Input
                            id="edit-websiteUrl"
                            value={formData.websiteUrl}
                            onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="edit-featured">Wyświetlaj na stronie głównej</Label>
                          <Switch
                            id="edit-featured"
                            checked={formData.featured}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, featured: checked })
                            }
                          />
                        </div>
                        <Button onClick={handleEditPartner} className="w-full">
                          Zapisz zmiany
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
