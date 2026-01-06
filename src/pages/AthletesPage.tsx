import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Users, ChevronRight, Trophy, X } from 'lucide-react';
import { mockResults } from '@/data/mockData';

const AthletesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Collect unique athletes from results
  const athletes = useMemo(() => {
    const athleteMap = new Map<string, {
      userId: string;
      name: string;
      racesCount: number;
      podiumCount: number;
    }>();

    mockResults.forEach(result => {
      if (!athleteMap.has(result.userId)) {
        athleteMap.set(result.userId, {
          userId: result.userId,
          name: result.userName,
          racesCount: 0,
          podiumCount: 0,
        });
      }
      const athlete = athleteMap.get(result.userId)!;
      athlete.racesCount++;
      if (result.position && result.position <= 3 && result.status === 'finished') {
        athlete.podiumCount++;
      }
    });

    return Array.from(athleteMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name, 'pl')
    );
  }, []);

  // Filter athletes by search query
  const filteredAthletes = useMemo(() => {
    if (!searchQuery.trim()) return athletes;

    const query = searchQuery.toLowerCase();
    return athletes.filter(a =>
      a.name.toLowerCase().includes(query)
    );
  }, [athletes, searchQuery]);

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Zawodnicy</h1>
          <p className="text-muted-foreground">
            Znajdź profil zawodnika i sprawdź jego wyniki
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Szukaj po imieniu lub nazwisku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <p className="text-sm text-muted-foreground text-center mb-6">
          {filteredAthletes.length} {filteredAthletes.length === 1 ? 'zawodnik' : 'zawodników'}
          {searchQuery && ` dla "${searchQuery}"`}
        </p>

        {/* Athletes Grid */}
        {filteredAthletes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAthletes.map((athlete) => (
              <Link key={athlete.userId} to={`/athlete/${athlete.userId}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{athlete.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>{athlete.racesCount} startów</span>
                          {athlete.podiumCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-yellow-500" />
                              {athlete.podiumCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">
              Nie znaleziono zawodników dla "{searchQuery}"
            </p>
            <Button variant="link" onClick={() => setSearchQuery('')}>
              Wyczyść wyszukiwanie
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AthletesPage;
