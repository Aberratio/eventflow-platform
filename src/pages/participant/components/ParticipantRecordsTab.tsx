import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonalRecord, Result } from '@/types';
import { Medal, TrendingUp, MapPin, Clock, Footprints } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ParticipantRecordsTabProps {
  personalRecords: PersonalRecord[];
  results: Result[];
}

const ParticipantRecordsTab = ({ personalRecords, results }: ParticipantRecordsTabProps) => {
  // Calculate statistics from results
  const totalRaces = results.length;
  const totalKilometers = results.reduce((acc, r) => {
    // Parse distance from name (simplified)
    const match = r.distanceName.match(/(\d+)/);
    return acc + (match ? parseInt(match[1]) : 0);
  }, 0);

  const averagePace =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.timeInSeconds / 60, 0) / results.length)
      : 0;

  const stats = [
    { label: 'Ukończone zawody', value: totalRaces, icon: Medal },
    { label: 'Łącznie kilometrów', value: totalKilometers, suffix: 'km', icon: MapPin },
    { label: 'Średni czas (min)', value: averagePace, icon: Clock },
  ];

  // Group records by distance type
  const distanceGroups = personalRecords.reduce(
    (acc, record) => {
      if (!acc[record.distance]) {
        acc[record.distance] = [];
      }
      acc[record.distance].push(record);
      return acc;
    },
    {} as Record<string, PersonalRecord[]>,
  );

  if (personalRecords.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Medal className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 font-semibold">Brak rekordów osobistych</h3>
          <p className="text-muted-foreground">
            Weź udział w zawodach, aby zacząć zbierać rekordy!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pb-3 pt-4 text-center sm:pb-4 sm:pt-6">
              <stat.icon className="mx-auto mb-2 h-5 w-5 text-primary sm:h-6 sm:w-6" />
              <div className="text-xl font-bold sm:text-2xl">
                {stat.value}
                {stat.suffix && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {stat.suffix}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Personal Records */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Rekordy życiowe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(distanceGroups).map(([distance, records]) => (
            <div key={distance} className="space-y-2">
              <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {distance}
              </h4>
              {records.map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3 sm:p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Footprints className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium sm:text-base">{record.eventName}</div>
                      <div className="text-xs text-muted-foreground sm:text-sm">
                        {format(new Date(record.date), 'd MMMM yyyy', { locale: pl })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-primary sm:text-xl">
                      {record.time}
                    </div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Rekord życiowy
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParticipantRecordsTab;
