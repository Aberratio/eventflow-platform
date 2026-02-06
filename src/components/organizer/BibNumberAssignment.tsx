import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { Event, Registration } from '@/types';
import { Hash, Trash2, AlertCircle } from 'lucide-react';

type SortingOption = 'date_paid' | 'name_paid' | 'date_all' | 'name_all';

interface BibNumberAssignmentProps {
  event: Event;
  registrations: Registration[];
  onRegistrationsChange: (registrations: Registration[]) => void;
}

export const BibNumberAssignment = ({
  event,
  registrations,
  onRegistrationsChange,
}: BibNumberAssignmentProps) => {
  const { toast } = useToast();
  const [sortingOption, setSortingOption] = useState<SortingOption>('date_paid');
  const [startNumber, setStartNumber] = useState('1');
  const [selectedDistances, setSelectedDistances] = useState<Set<string>>(
    new Set(event.distances.map(d => d.id))
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Calculate stats per distance
  const distanceStats = useMemo(() => {
    return event.distances.map(distance => {
      const distanceRegs = registrations.filter(
        r => r.distanceId === distance.id && r.status !== 'removed' && r.status !== 'cancelled'
      );
      const withoutNumber = distanceRegs.filter(r => !r.bibNumber).length;
      const withNumber = distanceRegs.filter(r => r.bibNumber).length;
      return {
        ...distance,
        withoutNumber,
        withNumber,
        total: distanceRegs.length,
      };
    });
  }, [event.distances, registrations]);

  // Get eligible participants based on sorting option
  const getEligibleParticipants = () => {
    const paidOnly = sortingOption === 'date_paid' || sortingOption === 'name_paid';
    const sortByName = sortingOption === 'name_paid' || sortingOption === 'name_all';

    let eligible = registrations.filter(r => {
      // Must not have bib number
      if (r.bibNumber) return false;
      // Must not be removed or cancelled
      if (r.status === 'removed' || r.status === 'cancelled') return false;
      // Must match selected distances
      if (!selectedDistances.has(r.distanceId)) return false;
      // If paid only, must be confirmed
      if (paidOnly && r.status !== 'confirmed') return false;
      return true;
    });

    // Sort
    if (sortByName) {
      eligible.sort((a, b) => a.userName.localeCompare(b.userName, 'pl'));
    } else {
      eligible.sort((a, b) => 
        new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime()
      );
    }

    return eligible;
  };

  const eligibleCount = getEligibleParticipants().length;

  const toggleDistance = (distanceId: string) => {
    const newSet = new Set(selectedDistances);
    if (newSet.has(distanceId)) {
      newSet.delete(distanceId);
    } else {
      newSet.add(distanceId);
    }
    setSelectedDistances(newSet);
  };

  const handleAssignBibNumbers = () => {
    const start = parseInt(startNumber, 10);
    if (isNaN(start) || start < 1) {
      toast({
        title: 'Błąd',
        description: 'Numer początkowy musi być liczbą większą od 0.',
        variant: 'destructive',
      });
      return;
    }

    const eligible = getEligibleParticipants();
    if (eligible.length === 0) {
      toast({
        title: 'Brak uczestników',
        description: 'Nie znaleziono uczestników spełniających kryteria.',
        variant: 'destructive',
      });
      return;
    }

    // Collect all used bib numbers
    const usedNumbers = new Set(
      registrations
        .filter(r => r.bibNumber)
        .map(r => parseInt(r.bibNumber!, 10))
        .filter(n => !isNaN(n))
    );

    let currentNumber = start;
    const updatedRegistrations = [...registrations];
    let assignedCount = 0;

    eligible.forEach(participant => {
      // Skip used numbers
      while (usedNumbers.has(currentNumber)) {
        currentNumber++;
      }
      
      // Find and update registration
      const index = updatedRegistrations.findIndex(r => r.id === participant.id);
      if (index !== -1) {
        updatedRegistrations[index] = {
          ...updatedRegistrations[index],
          bibNumber: String(currentNumber).padStart(3, '0'),
        };
        usedNumbers.add(currentNumber);
        currentNumber++;
        assignedCount++;
      }
    });

    onRegistrationsChange(updatedRegistrations);
    
    toast({
      title: 'Numery przydzielone',
      description: `Przydzielono numery ${assignedCount} ${assignedCount === 1 ? 'uczestnikowi' : 'uczestnikom'}.`,
    });
  };

  const handleRemoveAllBibNumbers = () => {
    const updatedRegistrations = registrations.map(r => {
      if (selectedDistances.has(r.distanceId) && r.bibNumber) {
        return { ...r, bibNumber: undefined };
      }
      return r;
    });

    const removedCount = registrations.filter(
      r => selectedDistances.has(r.distanceId) && r.bibNumber
    ).length;

    onRegistrationsChange(updatedRegistrations);
    setConfirmDeleteOpen(false);

    toast({
      title: 'Numery usunięte',
      description: `Usunięto numery ${removedCount} ${removedCount === 1 ? 'uczestnikowi' : 'uczestnikom'}.`,
    });
  };

  const totalWithoutNumber = distanceStats
    .filter(d => selectedDistances.has(d.id))
    .reduce((sum, d) => sum + d.withoutNumber, 0);

  const totalWithNumber = distanceStats
    .filter(d => selectedDistances.has(d.id))
    .reduce((sum, d) => sum + d.withNumber, 0);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Hash className="h-5 w-5" />
          Nadawanie numerów startowych
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Settings row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sortowanie</Label>
            <Select value={sortingOption} onValueChange={(v) => setSortingOption(v as SortingOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_paid">Po dacie zapisu (tylko opłaceni)</SelectItem>
                <SelectItem value="name_paid">Po nazwisku (tylko opłaceni)</SelectItem>
                <SelectItem value="date_all">Po dacie zapisu (wszyscy)</SelectItem>
                <SelectItem value="name_all">Po nazwisku (wszyscy)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startNumber">Numer początkowy</Label>
            <Input
              id="startNumber"
              type="number"
              min="1"
              value={startNumber}
              onChange={(e) => setStartNumber(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>

        {/* Distance selection */}
        <div className="space-y-3">
          <Label>Uwzględnij dystanse</Label>
          <div className="space-y-2">
            {distanceStats.map(distance => (
              <div key={distance.id} className="flex items-center gap-3">
                <Checkbox
                  id={`distance-${distance.id}`}
                  checked={selectedDistances.has(distance.id)}
                  onCheckedChange={() => toggleDistance(distance.id)}
                />
                <Label
                  htmlFor={`distance-${distance.id}`}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <span>{distance.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {distance.withoutNumber} bez numeru
                  </Badge>
                  {distance.withNumber > 0 && (
                    <Badge variant="secondary">
                      {distance.withNumber} z numerem
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        {eligibleCount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Do przydzielenia: <strong>{eligibleCount}</strong> {eligibleCount === 1 ? 'uczestnik' : 'uczestników'}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAssignBibNumbers}
            disabled={eligibleCount === 0 || selectedDistances.size === 0}
            className="flex-1"
          >
            <Hash className="h-4 w-4 mr-2" />
            Nadaj numery startowe! ({eligibleCount})
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={totalWithNumber === 0 || selectedDistances.size === 0}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Usuń wszystkie numery ({totalWithNumber})
          </Button>
        </div>

        {/* Confirm delete dialog */}
        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usuń numery startowe?</AlertDialogTitle>
              <AlertDialogDescription>
                Czy na pewno chcesz usunąć numery startowe {totalWithNumber} {totalWithNumber === 1 ? 'uczestnikowi' : 'uczestnikom'} 
                z wybranych dystansów? Ta operacja może wymagać ponownego przydzielenia numerów.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveAllBibNumbers}>
                Usuń numery
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
