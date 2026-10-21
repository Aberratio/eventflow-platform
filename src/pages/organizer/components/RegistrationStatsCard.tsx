import { useQuery } from '@tanstack/react-query';
import { LineChart as LineChartIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { getRegistrationStats } from '@/api';
import type { RegistrationStatsFieldCount } from '@/types';

interface RegistrationStatsCardProps {
  eventId: string;
}

/**
 * Built-in organizer cross-sections computed live
 * from the Zapis record itself — distance/payment-status/signup-curve
 * always present, gender/club/age-category shown only when the server
 * actually includes the corresponding key (RegistrationRepository::
 * organizerStats() omits it entirely when the field isn't configured for
 * this Event — see that method's own doc comment). This component mirrors
 * that contract: it checks for key PRESENCE, not array length, so an absent
 * breakdown renders nothing at all rather than an empty section.
 *
 * Sits alongside FormFieldAggregatesCard in the same "Zestawienia"
 * sub-tab — that card covers the configurable form's choice fields, this one
 * covers everything the spec calls "wbudowane" (built-in, not from the form).
 */
export const RegistrationStatsCard = ({ eventId }: RegistrationStatsCardProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['registration-stats', eventId],
    queryFn: () => getRegistrationStats(eventId),
    select: (r) => r.data,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">Ładowanie...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const signupChartConfig = {
    count: { label: 'Zapisy', color: 'hsl(var(--primary))' },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LineChartIcon className="h-5 w-5 text-primary" />
            Krzywa zapisów w czasie
          </CardTitle>
          <CardDescription>Liczba zapisów per dzień od otwarcia rejestracji</CardDescription>
        </CardHeader>
        <CardContent>
          {data.signupCurve.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Brak zapisów.</p>
          ) : (
            <>
              <ChartContainer config={signupChartConfig} className="h-[260px] w-full">
                <LineChart
                  data={data.signupCurve}
                  margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    className="text-muted-foreground"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
              {/* Accessible text alternative to the chart above — same data,
                  screen-reader only (WCAG 2.1 AA: no information conveyed
                  purely through an unlabeled SVG). */}
              <table className="sr-only">
                <caption>Liczba zapisów per dzień</caption>
                <thead>
                  <tr>
                    <th scope="col">Data</th>
                    <th scope="col">Liczba zapisów</th>
                  </tr>
                </thead>
                <tbody>
                  {data.signupCurve.map((day) => (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td>{day.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Zapisy wg dystansu</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={data.byDistance.map((d) => ({
                key: d.distanceId,
                label: d.distanceName,
                count: d.count,
              }))}
              emptyLabel="Brak zapisów."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status płatności</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList
              items={data.byPaymentStatus.map((s) => ({
                key: s.status,
                label: s.label,
                count: s.count,
              }))}
              emptyLabel="Brak zapisów."
            />
          </CardContent>
        </Card>

        {data.byGender && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Płeć</CardTitle>
            </CardHeader>
            <CardContent>
              <BarList items={data.byGender} emptyLabel="Brak danych." />
            </CardContent>
          </Card>
        )}

        {data.byClub && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Klub</CardTitle>
            </CardHeader>
            <CardContent>
              <BarList items={data.byClub} emptyLabel="Nikt nie podał klubu." />
            </CardContent>
          </Card>
        )}
      </div>

      {data.ageCategories && data.ageCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kategorie wiekowe</CardTitle>
            <CardDescription>Tylko dystanse z ustawionymi kategoriami wiekowymi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.ageCategories.map((distance) => (
              <div key={distance.distanceId}>
                <h3 className="mb-2 text-sm font-semibold">{distance.distanceName}</h3>
                <BarList items={distance.counts} emptyLabel="Brak danych." />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/** Shared accessible bar-list renderer — same text+bar shape as FormFieldAggregatesCard. */
const BarList = ({
  items,
  emptyLabel,
}: {
  items: RegistrationStatsFieldCount[];
  emptyLabel: string;
}) => {
  if (items.length === 0) {
    return <p className="py-2 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 truncate text-muted-foreground">{item.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right font-medium">{item.count}</span>
        </div>
      ))}
    </div>
  );
};
