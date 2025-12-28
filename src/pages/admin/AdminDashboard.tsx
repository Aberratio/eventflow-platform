import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockEvents, mockUsers } from '@/data/mockData';
import { Calendar, Users, Shield, Settings } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Panel Administratora</h1>
          <p className="text-muted-foreground">Pełna kontrola nad platformą</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10"><Calendar className="h-6 w-6 text-primary" /></div>
                <div>
                  <div className="text-2xl font-bold">{mockEvents.length}</div>
                  <div className="text-sm text-muted-foreground">Wydarzeń</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
                <div>
                  <div className="text-2xl font-bold">{mockUsers.length}</div>
                  <div className="text-sm text-muted-foreground">Użytkowników</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-destructive/10"><Shield className="h-6 w-6 text-destructive" /></div>
                <div>
                  <div className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'admin').length}</div>
                  <div className="text-sm text-muted-foreground">Adminów</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10"><Settings className="h-6 w-6 text-primary" /></div>
                <div>
                  <div className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'organizer').length}</div>
                  <div className="text-sm text-muted-foreground">Organizatorów</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader><CardTitle>Zarządzanie użytkownikami</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-muted rounded">{u.role}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Wszystkie wydarzenia</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockEvents.slice(0, 5).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{e.name}</div>
                      <div className="text-sm text-muted-foreground">{e.status}</div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/events/${e.id}`}>Edytuj</Link>
                    </Button>
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

export default AdminDashboard;
