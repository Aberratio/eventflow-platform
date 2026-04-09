import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { disciplineLabels } from '@/api/mock/labels';
import type { Event } from '@/types';

interface ModerationEventCardProps {
  event: Event;
  showRejection?: boolean;
  onViewDetails: (event: Event) => void;
  onApprove: (event: Event) => void;
  onReject: (event: Event) => void;
}

export const ModerationEventCard: React.FC<ModerationEventCardProps> = ({
  event,
  showRejection = false,
  onViewDetails,
  onApprove,
  onReject,
}) => (
  <Card className="overflow-hidden">
    <div className="flex flex-col md:flex-row">
      <div className="h-32 w-full md:h-auto md:w-48">
        <img src={event.imageUrl} alt={event.name} className="h-full w-full object-cover" />
      </div>
      <CardContent className="flex-1 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">{event.name}</h3>
              <Badge variant="outline" className="mt-1">
                {disciplineLabels[event.discipline]}
              </Badge>
            </div>
            {showRejection && event.rejectionReason && (
              <Badge variant="destructive" className="shrink-0">
                Odrzucone
              </Badge>
            )}
            {!showRejection && (
              <Badge
                variant="outline"
                className="shrink-0 border-warning/20 bg-warning/10 text-warning"
              >
                <Clock className="mr-1 h-3 w-3" />
                Oczekuje
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{event.organizerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{event.distances.length} dystans(ów)</span>
            </div>
          </div>

          {showRejection && event.rejectionReason && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2 font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Powód odrzucenia:
              </div>
              <p className="text-muted-foreground">{event.rejectionReason}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onViewDetails(event)}>
              <Eye className="mr-2 h-4 w-4" /> Szczegóły
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/events/${event.slug}`}>
                <Eye className="mr-2 h-4 w-4" /> Podgląd
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/admin/events/${event.id}`}>
                <FileText className="mr-2 h-4 w-4" /> Zarządzaj
              </a>
            </Button>
            {!showRejection && (
              <>
                <Button size="sm" onClick={() => onApprove(event)}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Zatwierdź
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onReject(event)}>
                  <XCircle className="mr-2 h-4 w-4" /> Odrzuć
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  </Card>
);
