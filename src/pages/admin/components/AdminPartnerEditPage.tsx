import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPartner, getPartnerById, updatePartner, uploadPartnerLogo } from '@/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import type { Partner } from '@/types';

interface FormErrors {
  name?: string;
  logoFile?: string;
  websiteUrl?: string;
}

type LogoVariant = 'light' | 'dark';

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

  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    featured: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isEditing || !id) return;
    let cancelled = false;

    getPartnerById(id)
      .then((response) => {
        if (cancelled) return;
        if (!response.data) {
          setNotFound(true);
          return;
        }
        setPartner(response.data);
        setFormData({
          name: response.data.name,
          websiteUrl: response.data.websiteUrl ?? '',
          featured: response.data.featured,
        });
      })
      .catch((error) => {
        if (!cancelled)
          toast.error(error instanceof Error ? error.message : 'Nie udalo sie pobrac partnera');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  const previewUrl = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile);
    return partner?.logoUrl ?? '';
  }, [logoFile, partner?.logoUrl]);

  const darkPreviewUrl = useMemo(() => {
    if (logoDarkFile) return URL.createObjectURL(logoDarkFile);
    return partner?.logoDarkUrl ?? '';
  }, [logoDarkFile, partner?.logoDarkUrl]);

  useEffect(() => {
    if (!logoFile || !previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [logoFile, previewUrl]);

  useEffect(() => {
    if (!logoDarkFile || !darkPreviewUrl) return;
    return () => URL.revokeObjectURL(darkPreviewUrl);
  }, [logoDarkFile, darkPreviewUrl]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Nazwa partnera jest wymagana';
    if (!logoFile && !partner?.logoUrl) newErrors.logoFile = 'Logo partnera jest wymagane';
    if (formData.websiteUrl && !isValidUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Podaj poprawny adres URL';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);

    try {
      const logoUrl = logoFile ? (await uploadPartnerLogo(logoFile)).data.url : partner?.logoUrl;
      const logoDarkUrl = logoDarkFile
        ? (await uploadPartnerLogo(logoDarkFile)).data.url
        : partner?.logoDarkUrl;
      if (!logoUrl) throw new Error('Logo partnera jest wymagane');

      const payload = {
        name: formData.name.trim(),
        logoUrl,
        logoDarkUrl,
        websiteUrl: formData.websiteUrl.trim() || undefined,
        featured: formData.featured,
      };

      if (isEditing && id) {
        await updatePartner(id, payload);
        toast.success(`Partner ${payload.name} zostal zaktualizowany`);
      } else {
        await createPartner(payload);
        toast.success(`Partner ${payload.name} zostal dodany`);
      }
      navigate('/admin/partners');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nie udalo sie zapisac partnera');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: 'name' | 'websiteUrl' | 'featured', value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const updateLogoFile = (variant: LogoVariant, file?: File) => {
    if (!file) return;
    if (variant === 'light') {
      setLogoFile(file);
    } else {
      setLogoDarkFile(file);
    }
    if (errors.logoFile) {
      setErrors((prev) => ({ ...prev, logoFile: undefined }));
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Ladowanie partnera...</p>
        </div>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Partner nie zostal znaleziony.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Powrot
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-8">
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
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Zapisywanie...' : isEditing ? 'Zapisz zmiany' : 'Dodaj partnera'}
          </Button>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoFile">Logo na jasne tlo *</Label>
                <Input
                  id="logoFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => updateLogoFile('light', e.target.files?.[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Podstawowy logotyp do jasnych powierzchni.
                </p>
                {errors.logoFile && <p className="text-sm text-destructive">{errors.logoFile}</p>}
                {previewUrl && (
                  <div className="flex h-24 w-full items-center justify-center rounded-lg border bg-muted">
                    <img
                      src={previewUrl}
                      alt="Podglad logo na jasne tlo"
                      className="max-h-20 max-w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoDarkFile">Logo na ciemne tlo</Label>
                <Input
                  id="logoDarkFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => updateLogoFile('dark', e.target.files?.[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Alternatywa dla czarnych lub ciemnych sekcji.
                </p>
                {darkPreviewUrl && (
                  <div className="flex h-24 w-full items-center justify-center rounded-lg border bg-neutral-950">
                    <img
                      src={darkPreviewUrl}
                      alt="Podglad logo na ciemne tlo"
                      className="max-h-20 max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

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
              <Label htmlFor="featured">Wyswietlaj na stronie glownej</Label>
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
