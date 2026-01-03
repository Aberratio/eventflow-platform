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
  
  const averagePace = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.timeInSeconds / 60), 0) / results.length)
    : 0;

  const stats = [
    { label: 'Ukończone zawody', value: totalRaces, icon: Medal },
    { label: 'Łącznie kilometrów', value: totalKilometers, suffix: 'km', icon: MapPin },
    { label: 'Średni czas (min)', value: averagePace, icon: Clock },
  ];

  // Group records by distance type
  const distanceGroups = personalRecords.reduce((acc, record) => {
    if (!acc[record.distance]) {
      acc[record.distance] = [];
    }
    acc[record.distance].push(record);
    return acc;
  }, {} as Record<string, PersonalRecord[]>);

  if (personalRecords.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Medal className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Brak rekordów osobistych</h3>
          <p className="text-muted-foreground">Weź udział w zawodach, aby zacząć zbierać rekordy!</p>
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
            <CardContent className="pt-4 pb-3 sm:pt-6 sm:pb-4 text-center">
              <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto text-primary mb-2" />
              <div className="text-xl sm:text-2xl font-bold">
                {stat.value}{stat.suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{stat.suffix}</span>}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Personal Records */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Rekordy życiowe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(distanceGroups).map(([distance, records]) => (
            <div key={distance} className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                {distance}
              </h4>
              {records.map((record, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 sm:p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Footprints className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm sm:text-base">{record.eventName}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(record.date), 'd MMMM yyyy', { locale: pl })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg sm:text-xl text-primary">
                      {record.time}
                    </div>
                    <Badge variant="secondary" className="text-xs mt-1">
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
