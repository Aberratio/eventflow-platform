import { archiveSeries, getSeries } from '@/api';
import { QUERY_KEYS, SERIES_STATUS_LABELS } from '@/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, Pencil, Plus, Archive } from 'lucide-react';
import { toast } from 'sonner';

interface AdminSeriesTabProps {
  basePath?: '/admin' | '/moderator';
}

export const AdminSeriesTab = ({ basePath = '/admin' }: AdminSeriesTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.series, 'staff'],
    queryFn: () => getSeries({ includeArchived: true }),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveSeries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.series });
      toast.success('Seria została zarchiwizowana');
    },
  });

  const series = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Serie wydarzeń</h2>
          <p className="text-muted-foreground">Konfiguracja cykli, wydarzeń i produktów</p>
        </div>
        <Button onClick={() => navigate(`${basePath}/series/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Nowa seria
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Ładowanie serii...</p>
      ) : series.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">Brak serii.</CardContent>
        </Card>
      ) : (
        series.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Layers className="h-4 w-4 text-primary" />
                  {item.name}
                  <Badge variant="outline">{SERIES_STATUS_LABELS[item.status]}</Badge>
                </h3>
                <p className="line-clamp-1 text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.eventIds.length} wydarzeń · {item.products?.length ?? 0} produktów
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`${basePath}/series/${item.id}/edit`)}
                >
                  <Pencil className="mr-1 h-4 w-4" /> Edytuj
                </Button>
                {item.status !== 'archived' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archiveMutation.mutate(item.id)}
                  >
                    <Archive className="mr-1 h-4 w-4" /> Archiwizuj
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
