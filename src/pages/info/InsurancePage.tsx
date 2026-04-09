import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Shield, Check, AlertCircle, FileText, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const coverageItems = [
  'Koszty leczenia do 50 000 zł',
  'Trwały uszczerbek na zdrowiu do 100 000 zł',
  'Śmierć wskutek NNW - 50 000 zł',
  'Koszty rehabilitacji do 10 000 zł',
  'Transport medyczny',
  'Assistance sportowy 24/7',
];

const faqItems = [
  {
    question: 'Kto może wykupić ubezpieczenie?',
    answer:
      'Ubezpieczenie NNW Zawodnika jest dostępne dla wszystkich uczestników wydarzeń organizowanych za pośrednictwem platformy ZmierzymyCzas. Można je wykupić podczas rejestracji na zawody.',
  },
  {
    question: 'Na jaki okres obowiązuje ubezpieczenie?',
    answer:
      'Ubezpieczenie obowiązuje od momentu startu zawodów do ich zakończenia oraz przez 2 godziny po przekroczeniu linii mety. Obejmuje również drogę na zawody i powrót z nich (do 24h przed i po wydarzeniu).',
  },
  {
    question: 'Co nie jest objęte ubezpieczeniem?',
    answer:
      'Ubezpieczenie nie obejmuje: urazów powstałych pod wpływem alkoholu lub środków odurzających, umyślnego działania, chorób przewlekłych, startów w zawodach ekstremalnych nieujętych w polisie.',
  },
  {
    question: 'Jak zgłosić szkodę?',
    answer:
      'Szkodę należy zgłosić w ciągu 7 dni od zdarzenia poprzez formularz online lub telefonicznie pod numerem 800 123 456. Do zgłoszenia potrzebna jest dokumentacja medyczna oraz numer polisy.',
  },
  {
    question: 'Czy mogę ubezpieczyć się na cały sezon?',
    answer:
      'Tak, oferujemy również ubezpieczenia sezonowe dla aktywnych sportowców. Skontaktuj się z nami, aby uzyskać indywidualną ofertę na ubezpieczenie roczne.',
  },
];

const InsurancePage = () => {
  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Ubezpieczenie NNW Zawodnika</h1>
              <p className="text-muted-foreground">Bezpieczeństwo na każdych zawodach</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-8 lg:col-span-2">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>O ubezpieczeniu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Ubezpieczenie NNW Zawodnika to kompleksowa ochrona dla uczestników wydarzeń
                  sportowych. Polisa obejmuje następstwa nieszczęśliwych wypadków powstałych podczas
                  udziału w zawodach, treningów przed startem oraz drogi na i z wydarzenia.
                </p>
                <p className="text-muted-foreground">
                  Ubezpieczenie jest dobrowolne i można je wykupić podczas rejestracji na zawody.
                  Składka jest kalkulowana indywidualnie w zależności od wieku uczestnika i rodzaju
                  dyscypliny.
                </p>
              </CardContent>
            </Card>

            {/* Coverage */}
            <Card>
              <CardHeader>
                <CardTitle>Zakres ochrony</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {coverageItems.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check className="h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Często zadawane pytania</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Pricing */}
            <Card className="border-primary">
              <CardHeader className="pb-2 text-center">
                <Badge className="mx-auto mb-2 w-fit">Cena od</Badge>
                <div className="text-4xl font-bold">9 zł</div>
                <p className="text-sm text-muted-foreground">za wydarzenie</p>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4 text-sm text-muted-foreground">
                  Składka zależy od wieku i rodzaju dyscypliny. Dokładna cena zostanie obliczona
                  podczas rejestracji.
                </p>
                <Button className="w-full" asChild>
                  <Link to="/wydarzenia">Znajdź zawody</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dokumenty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="#" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    OWU (PDF)
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="#" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Karta produktu (PDF)
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Zgłoszenie szkody</p>
                    <p className="mb-2 text-sm text-muted-foreground">
                      W razie wypadku skontaktuj się z infolinią:
                    </p>
                    <a
                      href="tel:800123456"
                      className="flex items-center gap-2 font-medium text-primary"
                    >
                      <Phone className="h-4 w-4" />
                      800 123 456
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InsurancePage;
