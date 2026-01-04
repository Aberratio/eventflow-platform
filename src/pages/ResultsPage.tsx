import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockEvents, mockResults, disciplineLabels } from '@/data/mockData';
import { Search, Trophy, Calendar, ExternalLink, Download, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

const ResultsPage = () => {
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedDistance, setSelectedDistance] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const completedEvents = mockEvents.filter(e => e.status === 'completed');

  // Get available distances for the selected event
  const availableDistances = useMemo(() => {
    if (selectedEvent === 'all') {
      const allDistances = new Set<string>();
      mockResults.forEach(r => allDistances.add(r.distanceName));
      return Array.from(allDistances);
    }
    const event = mockEvents.find(e => e.id === selectedEvent);
    return event?.distances.map(d => d.name) || [];
  }, [selectedEvent]);

  // Get available categories
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    mockResults
      .filter(r => selectedEvent === 'all' || r.eventId === selectedEvent)
      .filter(r => selectedDistance === 'all' || r.distanceName === selectedDistance)
      .forEach(r => categories.add(r.category));
    return Array.from(categories).sort();
  }, [selectedEvent, selectedDistance]);

  const filteredResults = useMemo(() => {
    return mockResults
      .filter(r => {
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            r.userName.toLowerCase().includes(searchLower) ||
            r.bibNumber.includes(search)
          );
        }
        return true;
      })
      .filter(r => selectedEvent === 'all' || r.eventId === selectedEvent)
      .filter(r => selectedDistance === 'all' || r.distanceName === selectedDistance)
      .filter(r => selectedCategory === 'all' || r.category === selectedCategory)
      .sort((a, b) => a.position - b.position);
  }, [search, selectedEvent, selectedDistance, selectedCategory]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof mockResults> = {};
    filteredResults.forEach(result => {
      if (!groups[result.eventId]) {
        groups[result.eventId] = [];
      }
      groups[result.eventId].push(result);
    });
    return groups;
  }, [filteredResults]);

  const handleExport = () => {
    toast({
      title: 'Eksport wyników',
      description: 'Pobieranie pliku CSV z wynikami...',
    });
    // Mock export - in production this would generate a real CSV
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedEvent('all');
    setSelectedDistance('all');
    setSelectedCategory('all');
  };

  const hasActiveFilters = search || selectedEvent !== 'all' || selectedDistance !== 'all' || selectedCategory !== 'all';

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wyniki zawodów</h1>
          <p className="text-muted-foreground">
            Przeszukuj wyniki wszystkich zakończonych wydarzeń.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 mb-8 space-y-4">
          {/* Search Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj po nazwisku lub numerze startowym..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Eksportuj
              </Button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filtry:</span>
            </div>
            <Select value={selectedEvent} onValueChange={(value) => {
              setSelectedEvent(value);
              setSelectedDistance('all');
              setSelectedCategory('all');
            }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Zawody" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie zawody</SelectItem>
                {completedEvents.map(event => (
                  <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDistance} onValueChange={(value) => {
              setSelectedDistance(value);
              setSelectedCategory('all');
            }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Dystans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie dystanse</SelectItem>
                {availableDistances.map(dist => (
                  <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Kategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kategorie</SelectItem>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Wyczyść
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {filteredResults.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedResults).map(([eventId, results]) => {
              const event = mockEvents.find(e => e.id === eventId);
              if (!event) return null;

              return (
                <Card key={eventId}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            {disciplineLabels[event.discipline]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {format(new Date(event.date), 'd MMMM yyyy', { locale: pl })}
                          </span>
                        </div>
                        <h2 className="text-xl font-semibold">{event.name}</h2>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/events/${event.slug}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Zobacz wydarzenie
                        </Link>
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Poz.</TableHead>
                          <TableHead className="w-20">Nr</TableHead>
                          <TableHead>Uczestnik</TableHead>
                          <TableHead>Dystans</TableHead>
                          <TableHead>Czas</TableHead>
                          <TableHead>Kategoria</TableHead>
                          <TableHead>Poz. kat.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {result.position <= 3 && (
                                  <Trophy className={`h-4 w-4 ${
                                    result.position === 1 ? 'text-yellow-500' :
                                    result.position === 2 ? 'text-gray-400' :
                                    'text-amber-600'
                                  }`} />
                                )}
                                <span className="font-bold">{result.position}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono">{result.bibNumber}</TableCell>
                            <TableCell>
                              <Link 
                                to={`/athlete/${result.userId}`}
                                className="font-medium hover:text-primary hover:underline transition-colors"
                              >
                                {result.userName}
                              </Link>
                            </TableCell>
                            <TableCell>{result.distanceName}</TableCell>
                            <TableCell className="font-mono font-medium">{result.time}</TableCell>
                            <TableCell>{result.category}</TableCell>
                            <TableCell>{result.categoryPosition}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters ? 'Nie znaleziono wyników dla podanych filtrów.' : 'Brak dostępnych wyników.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Wyczyść filtry
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResultsPage;
