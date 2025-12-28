import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockRegistrations, mockResults, mockPersonalRecords, mockMessages } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Trophy, Medal, Mail, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const userRegistrations = mockRegistrations.filter(r => r.userId === user?.id);
  const upcomingEvents = userRegistrations.filter(r => r.status === 'confirmed' || r.status === 'pending');
  const userResults = mockResults.filter(r => r.userId === user?.id);
  const unreadMessages = mockMessages.filter(m => m.toId === user?.id && !m.read);

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Witaj, {user?.name}!</h1>
          <p className="text-muted-foreground">Twój panel uczestnika</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{upcomingEvents.length}</div>
                  <div className="text-sm text-muted-foreground">Nadchodzące starty</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{userResults.length}</div>
                  <div className="text-sm text-muted-foreground">Ukończone zawody</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Medal className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{mockPersonalRecords.length}</div>
                  <div className="text-sm text-muted-foreground">Rekordy osobiste</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{unreadMessages.length}</div>
                  <div className="text-sm text-muted-foreground">Nowe wiadomości</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nadchodzące starty</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/participant/events">Zobacz wszystkie <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.slice(0, 3).map(reg => (
                    <div key={reg.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{reg.eventName}</div>
                        <div className="text-sm text-muted-foreground">{reg.distanceName}</div>
                      </div>
                      <div className="text-right">
                        {reg.bibNumber && <div className="font-mono text-lg font-bold">#{reg.bibNumber}</div>}
                        <Badge variant={reg.status === 'confirmed' ? 'default' : 'secondary'}>
                          {reg.status === 'confirmed' ? 'Potwierdzony' : 'Oczekuje'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nie masz jeszcze zapisów na zawody.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rekordy osobiste</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/participant/profile">Zobacz profil <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPersonalRecords.map((record, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{record.distance}</div>
                      <div className="text-sm text-muted-foreground">{record.eventName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-primary">{record.time}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(record.date), 'd MMM yyyy', { locale: pl })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ParticipantDashboard;
