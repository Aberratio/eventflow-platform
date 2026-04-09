import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Timer, Users, Trophy, BarChart3, Headphones, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: Timer,
    title: 'Pomiar czasu',
    description:
      'Profesjonalny chipowy pomiar czasu z dokładnością do 0.01 sekundy. Obsługujemy wydarzenia od 100 do 50,000 uczestników.',
    items: [
      'Chipy pasywne i aktywne',
      'Maty pomiarowe',
      'Wyniki w czasie rzeczywistym',
      'Certyfikaty online',
    ],
  },
  {
    icon: Users,
    title: 'System rejestracji',
    description:
      'Intuicyjny system zapisów online z płatnościami. Pełna automatyzacja procesu rejestracji.',
    items: ['Formularze zapisów', 'Płatności online', 'Kody rabatowe', 'Limity uczestników'],
  },
  {
    icon: Trophy,
    title: 'Publikacja wyników',
    description: 'Natychmiastowa publikacja wyników z podziałem na kategorie wiekowe i płciowe.',
    items: ['Wyniki na żywo', 'Klasyfikacje', 'Dyplomy PDF', 'Integracja z social media'],
  },
  {
    icon: BarChart3,
    title: 'Analityka i raporty',
    description:
      'Szczegółowe raporty i statystyki dla organizatorów. Dane demograficzne uczestników.',
    items: ['Dashboard organizatora', 'Eksport danych', 'Statystyki zapisów', 'Historia wydarzeń'],
  },
];

const packages = [
  {
    name: 'Starter',
    price: '500',
    description: 'Dla małych wydarzeń lokalnych',
    participants: 'do 200 uczestników',
    features: ['System rejestracji', 'Płatności online', 'Publikacja wyników', 'Wsparcie email'],
  },
  {
    name: 'Professional',
    price: '1500',
    description: 'Dla średnich imprez sportowych',
    participants: 'do 1000 uczestników',
    popular: true,
    features: [
      'Wszystko z Starter',
      'Pomiar czasu chipowy',
      'Wyniki live',
      'Wsparcie telefoniczne',
      'Dyplomy PDF',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Indywidualnie',
    description: 'Dla dużych wydarzeń masowych',
    participants: '1000+ uczestników',
    features: [
      'Wszystko z Professional',
      'Dedykowany opiekun',
      'Integracje API',
      'SLA 99.9%',
      'Własna domena',
    ],
  },
];

const OfferPage = () => {
  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Oferta dla organizatorów</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Kompleksowa obsługa wydarzeń sportowych - od rejestracji po publikację wyników.
            Profesjonalne narzędzia dla organizatorów każdej wielkości imprez.
          </p>
        </div>

        {/* Features */}
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">Pakiety cenowe</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {packages.map((pkg) => (
              <Card
                key={pkg.name}
                className={`relative ${pkg.popular ? 'border-primary shadow-lg' : ''}`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Najpopularniejszy
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle>{pkg.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{pkg.price}</span>
                    {pkg.price !== 'Indywidualnie' && (
                      <span className="text-muted-foreground"> zł</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    {pkg.participants}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={pkg.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to="/info/kontakt">Skontaktuj się</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-muted/50">
          <CardContent className="py-8 text-center">
            <Headphones className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-xl font-semibold">Potrzebujesz indywidualnej wyceny?</h3>
            <p className="mx-auto mb-6 max-w-md text-muted-foreground">
              Skontaktuj się z nami, a przygotujemy ofertę dopasowaną do Twojego wydarzenia.
            </p>
            <Button asChild>
              <Link to="/info/kontakt">
                Napisz do nas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OfferPage;
