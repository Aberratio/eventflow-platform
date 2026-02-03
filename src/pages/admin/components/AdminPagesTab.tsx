import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, MoreVertical, Eye, Pencil, Trash2, Globe, EyeOff, ArrowUp, ArrowDown, Mail, Gift, Shield, Users, HelpCircle, FileText, Scale, CreditCard } from 'lucide-react';
import { mockInfoPages } from '@/data/mockData';
import { InfoPage } from '@/types';
import { PageEditorDialog } from './PageEditorDialog';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Mail,
  Gift,
  Shield,
  Users,
  HelpCircle,
  FileText,
  Scale,
  CreditCard,
};

export const AdminPagesTab = () => {
  const [pages, setPages] = useState<InfoPage[]>(mockInfoPages);
  const [editingPage, setEditingPage] = useState<InfoPage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const { toast } = useToast();

  const sortedPages = [...pages].sort((a, b) => a.order - b.order);

  const handleCreatePage = () => {
    const newPage: InfoPage = {
      id: `page-${Date.now()}`,
      title: '',
      slug: '',
      icon: 'FileText',
      description: '',
      content: [],
      published: false,
      showInFooter: false,
      showInHeader: false,
      order: pages.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingPage(newPage);
    setIsDialogOpen(true);
  };

  const handleEditPage = (page: InfoPage) => {
    setEditingPage(page);
    setIsDialogOpen(true);
  };

  const handleSavePage = (page: InfoPage) => {
    const existingIndex = pages.findIndex(p => p.id === page.id);
    if (existingIndex >= 0) {
      const updated = [...pages];
      updated[existingIndex] = { ...page, updatedAt: new Date().toISOString() };
      setPages(updated);
      toast({ title: 'Zapisano zmiany', description: `Strona "${page.title}" została zaktualizowana.` });
    } else {
      setPages([...pages, page]);
      toast({ title: 'Utworzono stronę', description: `Strona "${page.title}" została dodana.` });
    }
    setIsDialogOpen(false);
    setEditingPage(null);
  };

  const handleDeletePage = (id: string) => {
    setPages(pages.filter(p => p.id !== id));
    setDeletePageId(null);
    toast({ title: 'Usunięto stronę', variant: 'destructive' });
  };

  const handleTogglePublish = (page: InfoPage) => {
    const updated = pages.map(p =>
      p.id === page.id ? { ...p, published: !p.published, updatedAt: new Date().toISOString() } : p
    );
    setPages(updated);
    toast({
      title: page.published ? 'Strona ukryta' : 'Strona opublikowana',
      description: `"${page.title}" jest teraz ${page.published ? 'ukryta' : 'widoczna publicznie'}.`,
    });
  };

  const handleMoveUp = (page: InfoPage) => {
    const index = sortedPages.findIndex(p => p.id === page.id);
    if (index <= 0) return;
    const prevPage = sortedPages[index - 1];
    const updated = pages.map(p => {
      if (p.id === page.id) return { ...p, order: prevPage.order };
      if (p.id === prevPage.id) return { ...p, order: page.order };
      return p;
    });
    setPages(updated);
  };

  const handleMoveDown = (page: InfoPage) => {
    const index = sortedPages.findIndex(p => p.id === page.id);
    if (index >= sortedPages.length - 1) return;
    const nextPage = sortedPages[index + 1];
    const updated = pages.map(p => {
      if (p.id === page.id) return { ...p, order: nextPage.order };
      if (p.id === nextPage.id) return { ...p, order: page.order };
      return p;
    });
    setPages(updated);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || FileText;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Strony informacyjne</CardTitle>
            <CardDescription>Zarządzaj treścią stron publicznych platformy</CardDescription>
          </div>
          <Button onClick={handleCreatePage}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj stronę
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedPages.map((page, index) => (
              <div
                key={page.id}
                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => handleMoveUp(page)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === sortedPages.length - 1}
                    onClick={() => handleMoveDown(page)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getIcon(page.icon)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{page.title}</span>
                    <span className="text-sm text-muted-foreground">/info/{page.slug}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{page.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={page.published ? 'default' : 'secondary'}>
                    {page.published ? 'Opublikowana' : 'Szkic'}
                  </Badge>
                  {page.showInFooter && (
                    <Badge variant="outline" className="text-xs">Stopka</Badge>
                  )}
                  {page.showInHeader && (
                    <Badge variant="outline" className="text-xs">Nagłówek</Badge>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditPage(page)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edytuj
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`/info/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        Podgląd
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTogglePublish(page)}>
                      {page.published ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Ukryj
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-2" />
                          Opublikuj
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeletePageId(page.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Usuń
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {editingPage && (
        <PageEditorDialog
          page={editingPage}
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingPage(null);
          }}
          onSave={handleSavePage}
        />
      )}

      <AlertDialog open={!!deletePageId} onOpenChange={() => setDeletePageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tę stronę?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Strona zostanie trwale usunięta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePageId && handleDeletePage(deletePageId)}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
