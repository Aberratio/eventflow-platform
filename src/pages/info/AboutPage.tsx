import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Users, Trophy, Target, Heart, Zap } from 'lucide-react';

const stats = [
  { value: '500+', label: 'Wydarzeń rocznie' },
  { value: '150k+', label: 'Uczestników' },
  { value: '50+', label: 'Organizatorów' },
  { value: '10+', label: 'Lat doświadczenia' },
];

const values = [
  {
    icon: Target,
    title: 'Precyzja',
    description: 'Dokładność pomiaru czasu to nasz priorytet. Każda setna sekundy ma znaczenie.',
  },
  {
    icon: Heart,
    title: 'Pasja',
    description:
      'Sami jesteśmy sportowcami i rozumiemy potrzeby zarówno uczestników, jak i organizatorów.',
  },
  {
    icon: Zap,
    title: 'Innowacja',
    description: 'Nieustannie rozwijamy nasze technologie, aby dostarczać najlepsze rozwiązania.',
  },
];

const team = [
  {
    name: 'Marek Kowalski',
    role: 'CEO & Founder',
    description: 'Maratończyk z 20-letnim stażem. Założył ZmierzymyCzas w 2016 roku.',
  },
  {
    name: 'Anna Nowak',
    role: 'CTO',
    description: 'Ekspertka od technologii pomiarowych. Odpowiada za rozwój platformy.',
  },
  {
    name: 'Piotr Wiśniewski',
    role: 'Head of Operations',
    description: 'Koordynuje obsługę wydarzeń w całej Polsce.',
  },
];

const AboutPage = () => {
  return (
    <Layout>
      <div className="container py-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Timer className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">O ZmierzymyCzas</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Jesteśmy zespołem pasjonatów sportu, którzy od ponad 10 lat dostarczają profesjonalne
            rozwiązania dla organizatorów wydarzeń sportowych w Polsce.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6 text-center">
                <div className="mb-1 text-3xl font-bold text-primary">{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Story */}
        <div className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Nasza historia</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4 text-muted-foreground">
              <p>
                ZmierzymyCzas powstał w 2016 roku z prostej potrzeby - jako organizatorzy biegów
                sami szukaliśmy narzędzia, które połączy rejestrację uczestników, pomiar czasu i
                publikację wyników w jednym miejscu.
              </p>
              <p>
                Zaczęliśmy od obsługi lokalnych biegów przełajowych w okolicach Warszawy. Dziś
                obsługujemy wydarzenia w całej Polsce - od kameralnych biegów górskich po masowe
                maratony z dziesiątkami tysięcy uczestników.
              </p>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Naszą misją jest uczynienie sportu dostępnym dla każdego. Wierzymy, że technologia
                powinna wspierać pasję, a nie ją komplikować. Dlatego nieustannie pracujemy nad tym,
                aby nasze rozwiązania były intuicyjne i niezawodne.
              </p>
              <p>
                Współpracujemy z Polskim Związkiem Lekkiej Atletyki oraz wieloma regionalnymi
                federacjami sportowymi. Jesteśmy dumni, że możemy wspierać rozwój sportu
                amatorskiego w Polsce.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="mb-6 text-2xl font-bold">Nasze wartości</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {values.map((value) => (
              <Card key={value.title}>
                <CardContent className="pt-6">
                  <value.icon className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-lg font-semibold">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <h2 className="mb-6 text-2xl font-bold">Zespół</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {team.map((member) => (
              <Card key={member.name}>
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="mb-2 text-sm text-primary">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
