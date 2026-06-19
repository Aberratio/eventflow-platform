import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEventBackgrounds,
  getEventBackgroundUsages,
  createEventBackground,
  deleteEventBackground,
  uploadEventBackground,
} from '@/api';
import type { EventBackground, EventBackgroundUsage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Trash2, Upload, Plus, ExternalLink } from 'lucide-react';
import { resolveApiAssetUrl } from '@/lib/utils';

export function AdminEventBackgroundsTab() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<EventBackground | null>(null);
  const [deleteUsages, setDeleteUsages] = useState<EventBackgroundUsage[]>([]);
  const [loadingUsages, setLoadingUsages] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['event-backgrounds'],
    queryFn: () => getEventBackgrounds().then((r) => r.data as EventBackground[]),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createEventBackground({ name: newName.trim(), imageUrl: uploadedUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-backgrounds'] });
      setAddOpen(false);
      setNewName('');
      setUploadedUrl('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEventBackground(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-backgrounds'] });
      setDeleteTarget(null);
      setDeleteUsages([]);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadEventBackground(file);
      setUploadedUrl(res.data.url);
    } catch {
      // upload error shown by the adapter
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openDeleteModal = async (bg: EventBackground) => {
    setDeleteTarget(bg);
    setLoadingUsages(true);
    try {
      const res = await getEventBackgroundUsages(bg.id);
      setDeleteUsages(res.data as EventBackgroundUsage[]);
    } finally {
      setLoadingUsages(false);
    }
  };

  const backgrounds = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tła wydarzeń</h2>
          <p className="text-sm text-muted-foreground">
            Biblioteka tła do wyboru podczas tworzenia wydarzenia.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj tło
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Ładowanie...</p>}

      {!isLoading && backgrounds.length === 0 && (
        <p className="text-sm text-muted-foreground">Brak tła w bibliotece.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {backgrounds.map((bg) => (
          <div key={bg.id} className="group relative overflow-hidden rounded-lg border">
            <img
              src={resolveApiAssetUrl(bg.thumbnailUrl ?? bg.imageUrl)}
              alt={bg.name}
              className="aspect-video w-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-2 transition-colors group-hover:bg-black/40">
              <div />
              <div className="flex items-end justify-between opacity-0 transition-opacity group-hover:opacity-100">
                <span className="truncate rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  {bg.name}
                </span>
                <button
                  type="button"
                  onClick={() => openDeleteModal(bg)}
                  className="rounded bg-destructive p-1 text-white hover:bg-destructive/80"
                  title="Usuń"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nowe tło</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nazwa</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="np. Górski pejzaż"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Zdjęcie</Label>
              {uploadedUrl ? (
                <div className="relative overflow-hidden rounded-lg border">
                  <img
                    src={uploadedUrl}
                    alt="podgląd"
                    className="aspect-video w-full object-cover"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute right-2 top-2"
                    onClick={() => setUploadedUrl('')}
                  >
                    Zmień
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                >
                  <Upload className="h-6 w-6" />
                  {uploading ? 'Przesyłanie...' : 'Kliknij aby wybrać plik (JPG, PNG, WebP)'}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || !uploadedUrl || createMutation.isPending}
            >
              {createMutation.isPending ? 'Zapisywanie...' : 'Dodaj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteUsages([]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Usuń tło
            </DialogTitle>
          </DialogHeader>

          {loadingUsages ? (
            <p className="text-sm text-muted-foreground">Sprawdzanie użycia...</p>
          ) : deleteUsages.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm">
                Nie można usunąć tła <strong>{deleteTarget?.name}</strong> — jest używane przez
                następujące wydarzenia:
              </p>
              <ul className="max-h-60 space-y-1 overflow-y-auto rounded-md border p-2">
                {deleteUsages.map((u) => (
                  <li key={u.id} className="flex items-center justify-between text-sm">
                    <span>
                      {u.name}{' '}
                      <span className="text-xs text-muted-foreground">({u.status})</span>
                    </span>
                    <a
                      href={`/events/${u.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 shrink-0 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Zmień tło w tych wydarzeniach, a następnie spróbuj ponownie.
              </p>
            </div>
          ) : (
            <p className="text-sm">
              Czy na pewno chcesz usunąć tło <strong>{deleteTarget?.name}</strong>? Operacja jest
              nieodwracalna.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteUsages([]);
              }}
            >
              Anuluj
            </Button>
            {deleteUsages.length === 0 && !loadingUsages && (
              <Button
                variant="destructive"
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Usuwanie...' : 'Usuń'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
