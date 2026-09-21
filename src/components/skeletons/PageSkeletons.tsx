import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/* ─── Wrapper z Layout (header + footer widoczne od razu) ─── */
const LayoutShell = ({ children }: { children: React.ReactNode }) => <Layout>{children}</Layout>;

/* ─── Hero skeleton (PageHero-style) ───────────────────────── */
const HeroSkeleton = ({ stats = 0 }: { stats?: number }) => (
  <div className="border-b border-border/50" style={{ background: 'var(--gradient-page-hero)' }}>
    <div className="container py-8 md:py-12">
      <div className="mb-2 flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 sm:w-72" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      {stats > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {Array.from({ length: stats }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-full" />
          ))}
        </div>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   EVENTS PAGE — Hero + sidebar filters + event list rows
   ═══════════════════════════════════════════════════════════════ */
export const EventsPageSkeleton = () => (
  <LayoutShell>
    <HeroSkeleton stats={3} />
    <div className="container py-6">
      <div className="flex gap-6">
        {/* Sidebar filters (desktop) */}
        <div className="hidden w-64 shrink-0 space-y-4 lg:block">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
        {/* Event list */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-24 rounded-md lg:hidden" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-border/50 bg-card p-4"
            >
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-3/5" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="hidden gap-2 sm:flex">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </LayoutShell>
);

/* ═══════════════════════════════════════════════════════════════
   SHOP PAGE — Hero + grid of product cards
   ═══════════════════════════════════════════════════════════════ */
export const ShopPageSkeleton = () => (
  <LayoutShell>
    <HeroSkeleton stats={4} />
    <div className="container py-6">
      {/* Filters bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      {/* Product grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full rounded-none" />
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-3/4" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-14" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </LayoutShell>
);

/* ═══════════════════════════════════════════════════════════════
   EVENT DETAILS — Hero banner + tabs + sidebar
   ═══════════════════════════════════════════════════════════════ */
export const EventDetailsSkeleton = () => (
  <LayoutShell>
    {/* Hero banner */}
    <div className="relative">
      <Skeleton className="h-64 w-full rounded-none sm:h-80" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
      <div className="container absolute bottom-0 left-0 right-0 pb-6">
        <Skeleton className="mb-2 h-8 w-2/3 sm:w-1/2" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
    <div className="container py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-md" />
            ))}
          </div>
          {/* Tab content */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-4/6" />
            <Skeleton className="mt-4 h-40 w-full rounded-lg" />
          </div>
        </div>
        {/* Sidebar */}
        <div className="w-full shrink-0 space-y-4 lg:w-80">
          <Card>
            <CardContent className="space-y-4 p-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </LayoutShell>
);

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD — Hero + tab bar + stat cards + content area
   (Participant / Organizer / Moderator)
   ═══════════════════════════════════════════════════════════════ */
export const DashboardSkeleton = () => (
  <LayoutShell>
    <HeroSkeleton />
    <div className="container py-6">
      {/* Tab bar */}
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-md" />
        ))}
      </div>
      {/* Stat cards row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Content area */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-border/50 bg-card p-4"
          >
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  </LayoutShell>
);

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD — Sidebar + content area
   ═══════════════════════════════════════════════════════════════ */
export const AdminDashboardSkeleton = () => (
  <LayoutShell>
    <div className="container py-8">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="hidden w-56 shrink-0 space-y-4 rounded-lg border border-border bg-card p-3 lg:block">
          {Array.from({ length: 5 }).map((_, g) => (
            <div key={g} className="space-y-1">
              <Skeleton className="mb-2 h-3 w-16" />
              {Array.from({ length: g === 0 ? 1 : g === 4 ? 1 : 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
          ))}
        </nav>
        {/* Content */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </LayoutShell>
);

/* ═══════════════════════════════════════════════════════════════
   AUTH PAGE — Centered card (login / register / forgot password)
   ═══════════════════════════════════════════════════════════════ */
export const AuthPageSkeleton = () => (
  <LayoutShell>
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="flex w-full max-w-4xl flex-col gap-8 lg:flex-row">
        <Card className="flex-1">
          <CardHeader className="space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center">
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>
            <Skeleton className="mx-auto h-7 w-40" />
            <Skeleton className="mx-auto h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </CardContent>
        </Card>
        <div className="hidden w-80 space-y-3 lg:block">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </LayoutShell>
);

/* ═══════════════════════════════════════════════════════════════
   SERIES / CHALLENGES LIST — Hero + card grid
   ═══════════════════════════════════════════════════════════════ */
export const ListPageSkeleton = () => (
  <LayoutShell>
    <HeroSkeleton stats={3} />
    <div className="container py-6">
      <div className="mb-6 flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-40 w-full rounded-none" />
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </LayoutShell>
);

/* ═══════════════════════════════════════════════════════════════
   PROFILE PAGE — Profile card + form fields + security sections
   ═══════════════════════════════════════════════════════════════ */
export const ProfilePageSkeleton = () => (
  <LayoutShell>
    <div className="container py-8">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="max-w-3xl space-y-6">
        {/* Avatar card */}
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </CardContent>
        </Card>
        {/* Form fields */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Security */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  </LayoutShell>
);

/* ═══════════════════════════════════════════════════════════════
   GENERIC EDIT/FORM PAGE — Back button + card with form fields
   ═══════════════════════════════════════════════════════════════ */
export const FormPageSkeleton = () => (
  <LayoutShell>
    <div className="container py-8">
      <Skeleton className="mb-4 h-8 w-24" />
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="max-w-3xl space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
    </div>
  </LayoutShell>
);
