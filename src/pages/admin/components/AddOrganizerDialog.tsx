import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { UserPlus, Check } from 'lucide-react';
import type { User } from '@/types';
import { toast } from 'sonner';

interface AddOrganizerDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  nonOrganizers: User[];
}

export const AddOrganizerDialog: React.FC<AddOrganizerDialogProps> = ({ open, onOpenChange, nonOrganizers }) => {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newNip, setNewNip] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [matchedUser, setMatchedUser] = useState<User | null>(null);

  const emailMatches = searchEmail.length >= 2
    ? nonOrganizers.filter(u => u.email.toLowerCase().includes(searchEmail.toLowerCase()))
    : [];

  const resetForm = () => {
    setNewName(''); setNewEmail(''); setNewPhone(''); setNewCompany(''); setNewNip('');
    setSearchEmail(''); setMatchedUser(null);
  };

  const handleAdd = () => {
    if (newName && newEmail) {
      toast.success(`Organizator ${newName} został dodany`);
      resetForm();
      onOpenChange(false);
    }
  };

  const handlePromote = () => {
    if (matchedUser) {
      toast.success(`Użytkownik ${matchedUser.name} otrzymał rolę organizatora`);
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Dodaj organizatora</DialogTitle></DialogHeader>
        <Tabs defaultValue="existing" className="pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Istniejący użytkownik</TabsTrigger>
            <TabsTrigger value="new">Nowy użytkownik</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Wyszukaj po emailu</Label>
              <Input type="email" value={searchEmail} onChange={(e) => { setSearchEmail(e.target.value); setMatchedUser(null); }} placeholder="Wpisz email użytkownika..." />
            </div>
            {searchEmail.length >= 2 && !matchedUser && (
              <div className="border border-border/50 rounded-md max-h-[200px] overflow-y-auto">
                {emailMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 text-center">Nie znaleziono użytkowników</p>
                ) : emailMatches.map(u => (
                  <button key={u.id} className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors text-left border-b last:border-b-0"
                    onClick={() => { setMatchedUser(u); setSearchEmail(u.email); }}>
                    <div><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    <Badge variant="outline" className="text-xs capitalize">{u.role}</Badge>
                  </button>
                ))}
              </div>
            )}
            {matchedUser && (
              <div className="border border-border/50 rounded-md p-4 bg-accent/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div><p className="font-medium">{matchedUser.name}</p><p className="text-sm text-muted-foreground">{matchedUser.email}</p></div>
                  <Badge variant="outline" className="capitalize">{matchedUser.role}</Badge>
                </div>
                <Button onClick={handlePromote} className="w-full"><Check className="h-4 w-4 mr-2" />Nadaj rolę organizatora</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Imię i nazwisko *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jan Kowalski" /></div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" /></div>
              <div className="space-y-2"><Label>Telefon</Label><Input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+48 123 456 789" /></div>
              <div className="space-y-2"><Label>Nazwa firmy</Label><Input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Firma Sp. z o.o." /></div>
              <div className="space-y-2 sm:col-span-2"><Label>NIP</Label><Input value={newNip} onChange={(e) => setNewNip(e.target.value)} placeholder="1234567890" /></div>
            </div>
            <Button onClick={handleAdd} className="w-full" disabled={!newName || !newEmail}>
              <UserPlus className="h-4 w-4 mr-2" />Dodaj organizatora
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
