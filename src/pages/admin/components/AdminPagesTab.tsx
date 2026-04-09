import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Globe,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Mail,
  Gift,
  Shield,
  Users,
  HelpCircle,
  FileText,
  Scale,
  CreditCard,
} from 'lucide-react';
import { mockInfoPages } from '@/api/mock/cms.mock';
import { InfoPage } from '@/types';
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
  const navigate = useNavigate();
  const [pages, setPages] = useState<InfoPage[]>(mockInfoPages);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const { toast } = useToast();

  const sortedPages = [...pages].sort((a, b) => a.order - b.order);

  const handleCreatePage = () => {
    navigate('/admin/pages/new');
  };

  const handleEditPage = (page: InfoPage) => {
    navigate(`/admin/pages/${page.id}/edit`);
  };

  const handleDeletePage = (id: string) => {
    setPages(pages.filter((p) => p.id !== id));
    setDeletePageId(null);
    toast({ title: 'Usunięto stronę', variant: 'destructive' });
  };

  const handleTogglePublish = (page: InfoPage) => {
    const updated = pages.map((p) =>
      p.id === page.id ? { ...p, published: !p.published, updatedAt: new Date().toISOString() } : p,
    );
    setPages(updated);
    toast({
      title: page.published ? 'Strona ukryta' : 'Strona opublikowana',
      description: `"${page.title}" jest teraz ${page.published ? 'ukryta' : 'widoczna publicznie'}.`,
    });
  };

  const handleMoveUp = (page: InfoPage) => {
    const index = sortedPages.findIndex((p) => p.id === page.id);
    if (index <= 0) return;
    const prevPage = sortedPages[index - 1];
    const updated = pages.map((p) => {
      if (p.id === page.id) return { ...p, order: prevPage.order };
      if (p.id === prevPage.id) return { ...p, order: page.order };
      return p;
    });
    setPages(updated);
  };

  const handleMoveDown = (page: InfoPage) => {
    const index = sortedPages.findIndex((p) => p.id === page.id);
    if (index >= sortedPages.length - 1) return;
    const nextPage = sortedPages[index + 1];
    const updated = pages.map((p) => {
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
            <Plus className="mr-2 h-4 w-4" />
            Dodaj stronę
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedPages.map((page, index) => (
              <div
                key={page.id}
                className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
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

                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  {getIcon(page.icon)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{page.title}</span>
                    <span className="text-sm text-muted-foreground">/info/{page.slug}</span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{page.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={page.published ? 'default' : 'secondary'}>
                    {page.published ? 'Opublikowana' : 'Szkic'}
                  </Badge>
                  {page.showInFooter && (
                    <Badge variant="outline" className="text-xs">
                      Stopka
                    </Badge>
                  )}
                  {page.showInHeader && (
                    <Badge variant="outline" className="text-xs">
                      Nagłówek
                    </Badge>
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
                      <Pencil className="mr-2 h-4 w-4" />
                      Edytuj
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`/info/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-4 w-4" />
                        Podgląd
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTogglePublish(page)}>
                      {page.published ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Ukryj
                        </>
                      ) : (
                        <>
                          <Globe className="mr-2 h-4 w-4" />
                          Opublikuj
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeletePageId(page.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Usuń
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
