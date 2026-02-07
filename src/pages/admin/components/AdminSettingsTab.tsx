import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, Save, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { mockGlobalInsuranceSettings } from '@/data/mockData';
import type { GlobalInsuranceSettings } from '@/types';

export const AdminSettingsTab = () => {
  const [insuranceSettings, setInsuranceSettings] = useState<GlobalInsuranceSettings>(mockGlobalInsuranceSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveInsurance = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    toast({
      title: 'Zapisano',
      description: 'Ustawienia ubezpieczeń zostały zaktualizowane',
    });
  };

  // Calculate example prices for preview
  const calculateExamplePrice = (age: number): number => {
    if (age > insuranceSettings.maxAge) return 0;
    const ageAddition = Math.max(0, age - 18) * insuranceSettings.ageMultiplier;
    return Math.round(insuranceSettings.baseFee + ageAddition);
  };

  const exampleAges = [18, 25, 30, 40, 50, 60, 70];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ustawienia platformy</h2>
        <p className="text-muted-foreground">Globalne konfiguracje systemu</p>
      </div>

      {/* Insurance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ubezpieczenia NNW
          </CardTitle>
          <CardDescription>
            Konfiguracja tekstu informacyjnego i kalkulatora składek ubezpieczeniowych
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info HTML Editor */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Tekst informacyjny dla uczestników</Label>
            <p className="text-sm text-muted-foreground">
              Ten tekst będzie wyświetlany w formularzu rejestracji przy opcji wykupienia ubezpieczenia.
            </p>
            <RichTextEditor
              value={insuranceSettings.infoHtml}
              onChange={(html) => setInsuranceSettings(prev => ({ ...prev, infoHtml: html }))}
              placeholder="Opisz szczegóły ubezpieczenia NNW..."
            />
          </div>

          <Separator />

          {/* Calculator Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <Label className="text-base font-medium">Kalkulator składek</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Wzór: <span className="font-mono bg-muted px-2 py-1 rounded">składka = opłata_bazowa + max(0, wiek - 18) × mnożnik_wiekowy</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseFee">Opłata bazowa (zł)</Label>
                <Input
                  id="baseFee"
                  type="number"
                  min={0}
                  step={1}
                  value={insuranceSettings.baseFee}
                  onChange={(e) => setInsuranceSettings(prev => ({ 
                    ...prev, 
                    baseFee: parseFloat(e.target.value) || 0 
                  }))}
                />
                <p className="text-xs text-muted-foreground">Minimalna składka dla osób 18 lat</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageMultiplier">Mnożnik wiekowy (zł/rok)</Label>
                <Input
                  id="ageMultiplier"
                  type="number"
                  min={0}
                  step={0.1}
                  value={insuranceSettings.ageMultiplier}
                  onChange={(e) => setInsuranceSettings(prev => ({ 
                    ...prev, 
                    ageMultiplier: parseFloat(e.target.value) || 0 
                  }))}
                />
                <p className="text-xs text-muted-foreground">Dodatek za każdy rok powyżej 18</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAge">Maksymalny wiek (lat)</Label>
                <Input
                  id="maxAge"
                  type="number"
                  min={18}
                  max={100}
                  step={1}
                  value={insuranceSettings.maxAge}
                  onChange={(e) => setInsuranceSettings(prev => ({ 
                    ...prev, 
                    maxAge: parseInt(e.target.value) || 70 
                  }))}
                />
                <p className="text-xs text-muted-foreground">Osoby starsze nie mogą wykupić ubezpieczenia</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Example Prices Preview */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Przykładowe składki</Label>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {exampleAges.map((age) => {
                  const price = calculateExamplePrice(age);
                  const isOver = age > insuranceSettings.maxAge;
                  
                  return (
                    <div 
                      key={age} 
                      className={`text-center p-2 rounded ${isOver ? 'bg-destructive/10 text-muted-foreground' : 'bg-background'}`}
                    >
                      <div className="text-sm text-muted-foreground">{age} lat</div>
                      <div className={`font-bold ${isOver ? 'text-destructive line-through' : 'text-primary'}`}>
                        {isOver ? 'N/D' : `${price} zł`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveInsurance} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Zapisywanie...' : 'Zapisz ustawienia ubezpieczeń'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsTab;
