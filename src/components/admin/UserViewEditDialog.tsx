import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@/types';

interface UserViewEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  extraViewContent?: React.ReactNode;
}

export const UserViewEditDialog = ({ open, onOpenChange, user, extraViewContent }: UserViewEditDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      setEditData({ ...user });
      setIsEditing(false);
    }
  }, [user]);

  const handleSave = () => {
    toast.success(`Dane użytkownika ${editData.name} zostały zaktualizowane`);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (user) setEditData({ ...user });
    setIsEditing(false);
  };

  if (!user) return null;

  const isParticipant = user.role === 'participant';
  const isOrganizer = user.role === 'organizer';

  const roleLabel = isParticipant ? 'uczestnika' : isOrganizer ? 'organizatora' : 'użytkownika';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setIsEditing(false); } onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>Profil {roleLabel}</DialogTitle>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edytuj
              </Button>
            )}
          </div>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Imię i nazwisko</Label>
                <Input value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editData.email || ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input type="tel" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} placeholder="np. +48 123 456 789" />
              </div>

              {isParticipant && (
                <>
                  <div className="space-y-2">
                    <Label>Rok urodzenia</Label>
                    <Input type="number" value={editData.birthYear || ''} onChange={(e) => setEditData({ ...editData, birthYear: e.target.value ? Number(e.target.value) : undefined })} placeholder="np. 1990" />
                  </div>
                  <div className="space-y-2">
                    <Label>Płeć</Label>
                    <Select value={editData.gender || ''} onValueChange={(v) => setEditData({ ...editData, gender: v as 'M' | 'K' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Mężczyzna</SelectItem>
                        <SelectItem value="K">Kobieta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Klub</Label>
                    <Input value={editData.club || ''} onChange={(e) => setEditData({ ...editData, club: e.target.value })} placeholder="Nazwa klubu" />
                  </div>
                </>
              )}

              {isOrganizer && (
                <>
                  <div className="space-y-2">
                    <Label>Nazwa firmy</Label>
                    <Input value={editData.companyName || ''} onChange={(e) => setEditData({ ...editData, companyName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>NIP</Label>
                    <Input value={editData.nip || ''} onChange={(e) => setEditData({ ...editData, nip: e.target.value })} placeholder="np. 1234567890" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Strona www</Label>
                    <Input type="url" value={editData.website || ''} onChange={(e) => setEditData({ ...editData, website: e.target.value })} placeholder="https://" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Opis</Label>
                    <Textarea value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={3} />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Anuluj
              </Button>
              <Button onClick={handleSave}>Zapisz zmiany</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
              <span className="text-muted-foreground">Imię i nazwisko</span>
              <span className="font-medium">{user.name}</span>
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>
              {user.phone && (
                <>
                  <span className="text-muted-foreground">Telefon</span>
                  <span>{user.phone}</span>
                </>
              )}

              {isParticipant && (
                <>
                  {user.birthYear && (
                    <>
                      <span className="text-muted-foreground">Rok urodzenia</span>
                      <span>{user.birthYear}</span>
                    </>
                  )}
                  {user.gender && (
                    <>
                      <span className="text-muted-foreground">Płeć</span>
                      <span>{user.gender === 'M' ? 'Mężczyzna' : 'Kobieta'}</span>
                    </>
                  )}
                  {user.club && (
                    <>
                      <span className="text-muted-foreground">Klub</span>
                      <span>{user.club}</span>
                    </>
                  )}
                </>
              )}

              {isOrganizer && (
                <>
                  {user.companyName && (
                    <>
                      <span className="text-muted-foreground">Firma</span>
                      <span>{user.companyName}</span>
                    </>
                  )}
                  {user.nip && (
                    <>
                      <span className="text-muted-foreground">NIP</span>
                      <span>{user.nip}</span>
                    </>
                  )}
                  {user.website && (
                    <>
                      <span className="text-muted-foreground">Strona www</span>
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{user.website}</a>
                    </>
                  )}
                </>
              )}
            </div>

            {isOrganizer && user.description && (
              <>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">Opis</span>
                  <p className="text-sm mt-1">{user.description}</p>
                </div>
              </>
            )}

            {extraViewContent && (
              <>
                <Separator />
                {extraViewContent}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
