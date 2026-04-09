import { mockPartners } from '@/api';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Handshake } from 'lucide-react';
import { toast } from 'sonner';

interface FormErrors {
  name?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

const isValidUrl = (url: string) => {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const AdminPartnerEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const partner = isEditing ? mockPartners.find((p) => p.id === id) : null;

  const [formData, setFormData] = useState({
    name: partner?.name || '',
    logoUrl: partner?.logoUrl || '',
    websiteUrl: partner?.websiteUrl || '',
    featured: partner?.featured ?? true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nazwa partnera jest wymagana';
    if (!formData.logoUrl.trim()) newErrors.logoUrl = 'URL logotypu jest wymagany';
    else if (!isValidUrl(formData.logoUrl)) newErrors.logoUrl = 'Podaj poprawny adres URL';
    if (formData.websiteUrl && !isValidUrl(formData.websiteUrl))
      newErrors.websiteUrl = 'Podaj poprawny adres URL';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    toast.success(
      isEditing
        ? `Partner ${formData.name} został zaktualizowany`
        : `Partner ${formData.name} został dodany`,
    );
    navigate(-1);
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (isEditing && !partner) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Partner nie został znaleziony.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Powrót
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Handshake className="h-6 w-6 text-primary" />
              {isEditing ? `Edytuj: ${partner?.name}` : 'Nowy partner'}
            </h1>
          </div>
          <Button onClick={handleSave}>{isEditing ? 'Zapisz zmiany' : 'Dodaj partnera'}</Button>
        </div>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa partnera *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Nazwa firmy"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL logotypu *</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) => updateField('logoUrl', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl}</p>}
            </div>

            {formData.logoUrl && isValidUrl(formData.logoUrl) && (
              <div className="space-y-2">
                <Label>Podgląd logotypu</Label>
                <div className="flex h-24 w-full items-center justify-center rounded-lg border bg-muted">
                  <img
                    src={formData.logoUrl}
                    alt="Podgląd logotypu"
                    className="max-h-20 max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Strona internetowa (opcjonalna)</Label>
              <Input
                id="websiteUrl"
                value={formData.websiteUrl}
                onChange={(e) => updateField('websiteUrl', e.target.value)}
                placeholder="https://example.com"
              />
              {errors.websiteUrl && <p className="text-sm text-destructive">{errors.websiteUrl}</p>}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Wyświetlaj na stronie głównej</Label>
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => updateField('featured', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
