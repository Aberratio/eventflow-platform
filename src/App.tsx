import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { OnboardingDialog } from '@/components/OnboardingDialog';
import { CookieConsent } from '@/components/CookieConsent';
import { BottomNav } from '@/components/layout/BottomNav';
import { ScrollToTop } from './components/ScrollToTop';
import { DevToolbox } from '@/components/dev/DevToolbox';
import { ErrorBoundary } from '@/components/errors';
import {
  EventsPageSkeleton,
  ShopPageSkeleton,
  EventDetailsSkeleton,
  DashboardSkeleton,
  AdminDashboardSkeleton,
  AuthPageSkeleton,
  ListPageSkeleton,
  ProfilePageSkeleton,
  FormPageSkeleton,
} from '@/components/skeletons';

// ─── Eagerly loaded (critical path) ───────────────────────
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import type { UserRole } from '@/types';

// ─── Lazy-loaded pages (code-split) ──────────────────────
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ConfirmEmailChangePage = lazy(() => import('./pages/ConfirmEmailChangePage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const EventRegistrationPage = lazy(() => import('./pages/EventRegistrationPage'));
const EventRegistrationEmbed = lazy(() => import('./pages/EventRegistrationEmbed'));
const EmbedEventRegistrationPage = lazy(() => import('./pages/EmbedEventRegistrationPage'));
const RegistrationSuccessPage = lazy(() => import('./pages/RegistrationSuccessPage'));
const LiveResultsPage = lazy(() => import('./pages/LiveResultsPage'));
const SeriesListPage = lazy(() => import('./pages/SeriesListPage'));
const SeriesDetailsPage = lazy(() => import('./pages/SeriesDetailsPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ShopProductPage = lazy(() => import('./pages/ShopProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const AthleteProfilePage = lazy(() => import('./pages/AthleteProfilePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChallengesListPage = lazy(() => import('./pages/ChallengesListPage'));
const ChallengeDetailsPage = lazy(() => import('./pages/ChallengeDetailsPage'));
const StatusError = lazy(() => import('./pages/StatusError'));
const ServerError = lazy(() => import('./pages/ServerError'));
const ServiceUnavailable = lazy(() => import('./pages/ServiceUnavailable'));
const Forbidden = lazy(() => import('./pages/Forbidden'));

// Dashboard pages (heaviest — always lazy)
const ParticipantDashboard = lazy(() => import('./pages/participant/ParticipantDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/organizer/OrganizerDashboard'));
const OrganizerEventsPage = lazy(() => import('./pages/organizer/OrganizerEventsPage'));
const EventForm = lazy(() => import('./pages/organizer/EventForm'));
const EventManage = lazy(() => import('./pages/organizer/EventManage'));
const ModeratorDashboard = lazy(() => import('./pages/moderator/ModeratorDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

const AdminEventManage = lazy(() =>
  import('./pages/admin/components/AdminEventManage').then((m) => ({
    default: m.AdminEventManage,
  })),
);
const PageEditorPage = lazy(() =>
  import('./pages/admin/components/PageEditorPage').then((m) => ({ default: m.PageEditorPage })),
);
const AdminProductEditPage = lazy(() =>
  import('./pages/admin/components/AdminProductEditPage').then((m) => ({
    default: m.AdminProductEditPage,
  })),
);
const AdminOrderEditPage = lazy(() =>
  import('./pages/admin/components/AdminOrderEditPage').then((m) => ({
    default: m.AdminOrderEditPage,
  })),
);
const AdminChallengeEditPage = lazy(() =>
  import('./pages/admin/components/AdminChallengeEditPage').then((m) => ({
    default: m.AdminChallengeEditPage,
  })),
);
const AdminSeriesEditPage = lazy(() =>
  import('./pages/admin/components/AdminSeriesEditPage').then((m) => ({
    default: m.AdminSeriesEditPage,
  })),
);
const AdminPartnerEditPage = lazy(() =>
  import('./pages/admin/components/AdminPartnerEditPage').then((m) => ({
    default: m.AdminPartnerEditPage,
  })),
);
const DynamicInfoPage = lazy(() =>
  import('./components/info/DynamicInfoPage').then((m) => ({ default: m.DynamicInfoPage })),
);

// ─── Typed Suspense wrapper ──────────────────────────────
const Lazy = ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => (
  <Suspense fallback={fallback}>{children}</Suspense>
);

const adminRoles: UserRole[] = ['admin', 'superadmin'];
const moderatorRoles: UserRole[] = ['moderator'];
const organizerRoles: UserRole[] = ['organizer'];
const participantRoles: UserRole[] = ['participant'];

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/logowanie"
        replace
        state={{ returnTo: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

// ─── QueryClient with optimised defaults ─────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — avoid refetching on every mount
      gcTime: 10 * 60 * 1000, // 10 min garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// E8.11: `/embed/*` routes render inside a third-party iframe on an external
// site — the normal site chrome (bottom nav, onboarding dialog, cookie
// banner, dev toolbox) has no business showing up there, so this shell
// suppresses it for that one path prefix. Split out from `App` because
// `useLocation()` needs Router context, which only exists below
// `<BrowserRouter>`.
const AppShell = () => {
  const location = useLocation();
  const isEmbedRoute = location.pathname.startsWith('/embed/');

  return (
    <ErrorBoundary>
      <ScrollToTop />
      {!isEmbedRoute && (
        <>
          <OnboardingDialog />
          <CookieConsent />
        </>
      )}
      <div className={isEmbedRoute ? undefined : 'pb-16 md:pb-0'}>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Polish routes */}
          <Route
            path="/wydarzenia"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <EventsPage />
              </Lazy>
            }
          />
          {/* Legacy / external links to the results archive: the archive is the finished-events list. */}
          <Route path="/wyniki" element={<Navigate to="/events?status=past" replace />} />
          <Route path="/results" element={<Navigate to="/events?status=past" replace />} />
          <Route
            path="/wyniki/live"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <LiveResultsPage />
              </Lazy>
            }
          />
          <Route
            path="/info/:slug"
            element={
              <Lazy fallback={<EventDetailsSkeleton />}>
                <DynamicInfoPage />
              </Lazy>
            }
          />
          <Route
            path="/logowanie"
            element={
              <Lazy fallback={<AuthPageSkeleton />}>
                <LoginPage />
              </Lazy>
            }
          />
          <Route
            path="/rejestracja"
            element={
              <Lazy fallback={<AuthPageSkeleton />}>
                <RegisterPage />
              </Lazy>
            }
          />
          <Route
            path="/sklep"
            element={
              <Lazy fallback={<ShopPageSkeleton />}>
                <ShopPage />
              </Lazy>
            }
          />
          {/* English routes */}
          <Route
            path="/login"
            element={
              <Lazy fallback={<AuthPageSkeleton />}>
                <LoginPage />
              </Lazy>
            }
          />
          <Route
            path="/register"
            element={
              <Lazy fallback={<AuthPageSkeleton />}>
                <RegisterPage />
              </Lazy>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <Lazy fallback={<AuthPageSkeleton />}>
                <ForgotPasswordPage />
              </Lazy>
            }
          />
          <Route
            path="/reset-password"
            element={
              <Lazy fallback={<AuthPageSkeleton />}>
                <ResetPasswordPage />
              </Lazy>
            }
          />
          <Route
            path="/verify-email"
            element={
              <Lazy fallback={<AuthPageSkeleton />}>
                <VerifyEmailPage />
              </Lazy>
            }
          />
          <Route
            path="/confirm-email-change"
            element={
              <Lazy fallback={<AuthPageSkeleton />}>
                <ConfirmEmailChangePage />
              </Lazy>
            }
          />
          <Route
            path="/events"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <EventsPage />
              </Lazy>
            }
          />
          <Route
            path="/events/:slug"
            element={
              <Lazy fallback={<EventDetailsSkeleton />}>
                <EventDetailsPage />
              </Lazy>
            }
          />
          <Route
            path="/events/:slug/:tab"
            element={
              <Lazy fallback={<EventDetailsSkeleton />}>
                <EventDetailsPage />
              </Lazy>
            }
          />
          <Route
            path="/events/:slug/preview"
            element={
              <Lazy fallback={<EventDetailsSkeleton />}>
                <EventDetailsPage previewMode />
              </Lazy>
            }
          />
          <Route
            path="/events/:slug/preview/:tab"
            element={
              <Lazy fallback={<EventDetailsSkeleton />}>
                <EventDetailsPage previewMode />
              </Lazy>
            }
          />
          <Route
            path="/events/:slug/register"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <EventRegistrationPage />
              </Lazy>
            }
          />
          <Route
            path="/events/:slug/register/preview"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <EventRegistrationPage previewMode />
              </Lazy>
            }
          />
          <Route
            path="/events/:slug/embed"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <EventRegistrationEmbed />
              </Lazy>
            }
          />
          <Route
            path="/events/:slug/register/success"
            element={
              <Lazy fallback={<EventDetailsSkeleton />}>
                <RegistrationSuccessPage />
              </Lazy>
            }
          />
          {/*
                    E8.11: the dedicated, chrome-free embed route — organizer
                    sites <iframe> this. Keyed by the event's real `id` (not
                    `:slug` like every other registration route above)
                    because it mirrors the server's id-keyed embed contract
                    (`GET /events/{id}/embed/public`, `PATCH /events/{id}`)
                    one-to-one, so no slug lookup is needed before the
                    allowlist/enabled check.
                  */}
          <Route
            path="/embed/event/:id/register"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <EmbedEventRegistrationPage />
              </Lazy>
            }
          />
          <Route
            path="/series"
            element={
              <Lazy fallback={<ListPageSkeleton />}>
                <SeriesListPage />
              </Lazy>
            }
          />
          <Route
            path="/series/:slug"
            element={
              <Lazy fallback={<EventDetailsSkeleton />}>
                <SeriesDetailsPage />
              </Lazy>
            }
          />
          <Route
            path="/shop"
            element={
              <Lazy fallback={<ShopPageSkeleton />}>
                <ShopPage />
              </Lazy>
            }
          />
          <Route
            path="/shop/:slug"
            element={
              <Lazy fallback={<EventDetailsSkeleton />}>
                <ShopProductPage />
              </Lazy>
            }
          />
          <Route
            path="/cart"
            element={
              <Lazy fallback={<ShopPageSkeleton />}>
                <CartPage />
              </Lazy>
            }
          />
          <Route
            path="/order-success"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <OrderSuccessPage />
              </Lazy>
            }
          />
          <Route
            path="/athlete/:userId"
            element={
              <Lazy fallback={<ProfilePageSkeleton />}>
                <AthleteProfilePage />
              </Lazy>
            }
          />
          <Route
            path="/profile"
            element={
              <Lazy fallback={<ProfilePageSkeleton />}>
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/challenges"
            element={
              <Lazy fallback={<ListPageSkeleton />}>
                <ChallengesListPage />
              </Lazy>
            }
          />
          <Route
            path="/challenges/:slug"
            element={
              <Lazy fallback={<EventDetailsSkeleton />}>
                <ChallengeDetailsPage />
              </Lazy>
            }
          />
          <Route
            path="/participant"
            element={
              <Lazy fallback={<DashboardSkeleton />}>
                <ProtectedRoute roles={participantRoles}>
                  <ParticipantDashboard />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/participant/*"
            element={
              <Lazy fallback={<DashboardSkeleton />}>
                <ProtectedRoute roles={participantRoles}>
                  <ParticipantDashboard />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/organizer"
            element={
              <Lazy fallback={<DashboardSkeleton />}>
                <ProtectedRoute roles={organizerRoles}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/organizer/events"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <ProtectedRoute roles={organizerRoles}>
                  <OrganizerEventsPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/organizer/events/new"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={organizerRoles}>
                  <EventForm />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/organizer/events/:id"
            element={
              <Lazy fallback={<DashboardSkeleton />}>
                <ProtectedRoute roles={organizerRoles}>
                  <EventManage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/organizer/events/:id/:tab"
            element={
              <Lazy fallback={<DashboardSkeleton />}>
                <ProtectedRoute roles={organizerRoles}>
                  <EventManage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/organizer/events/:id/edit"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={organizerRoles}>
                  <EventForm />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/moderator"
            element={
              <Lazy fallback={<DashboardSkeleton />}>
                <ProtectedRoute roles={moderatorRoles}>
                  <ModeratorDashboard />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/moderator/series/new"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={moderatorRoles}>
                  <AdminSeriesEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/moderator/series/:id/edit"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={moderatorRoles}>
                  <AdminSeriesEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/moderator/events/:id"
            element={
              <Lazy fallback={<DashboardSkeleton />}>
                <ProtectedRoute roles={moderatorRoles}>
                  <EventManage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/moderator/events/:id/:tab"
            element={
              <Lazy fallback={<DashboardSkeleton />}>
                <ProtectedRoute roles={moderatorRoles}>
                  <EventManage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/moderator/events/:id/edit"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={moderatorRoles}>
                  <EventForm />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/moderator/events/new"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={moderatorRoles}>
                  <EventForm />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/moderator/*"
            element={
              <Lazy fallback={<DashboardSkeleton />}>
                <ProtectedRoute roles={moderatorRoles}>
                  <ModeratorDashboard />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin"
            element={
              <Lazy fallback={<AdminDashboardSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminDashboard />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/events/new"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <EventForm />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/events/:id"
            element={
              <Lazy fallback={<DashboardSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminEventManage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/events/:id/edit"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <EventForm />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/series/new"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminSeriesEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/series/:id/edit"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminSeriesEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/shop/products/new"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminProductEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/shop/products/:id/edit"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminProductEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/pages/new"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <PageEditorPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/pages/:pageId/edit"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <PageEditorPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/orders/:id/edit"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminOrderEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/challenges/new"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminChallengeEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/challenges/:id/edit"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminChallengeEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/partners/new"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminPartnerEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/partners/:id/edit"
            element={
              <Lazy fallback={<FormPageSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminPartnerEditPage />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/:section"
            element={
              <Lazy fallback={<AdminDashboardSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminDashboard />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Lazy fallback={<AdminDashboardSkeleton />}>
                <ProtectedRoute roles={adminRoles}>
                  <AdminDashboard />
                </ProtectedRoute>
              </Lazy>
            }
          />
          <Route path="/404" element={<NotFound />} />
          <Route
            path="/400"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <StatusError code="400" />
              </Lazy>
            }
          />
          <Route
            path="/401"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <StatusError code="401" />
              </Lazy>
            }
          />
          <Route
            path="/405"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <StatusError code="405" />
              </Lazy>
            }
          />
          <Route
            path="/409"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <StatusError code="409" />
              </Lazy>
            }
          />
          <Route
            path="/422"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <StatusError code="422" />
              </Lazy>
            }
          />
          <Route
            path="/429"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <StatusError code="429" />
              </Lazy>
            }
          />
          <Route
            path="/500"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <ServerError />
              </Lazy>
            }
          />
          <Route
            path="/502"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <StatusError code="502" />
              </Lazy>
            }
          />
          <Route
            path="/503"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <ServiceUnavailable />
              </Lazy>
            }
          />
          <Route
            path="/504"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <StatusError code="504" />
              </Lazy>
            }
          />
          <Route
            path="/403"
            element={
              <Lazy fallback={<EventsPageSkeleton />}>
                <Forbidden />
              </Lazy>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {!isEmbedRoute && (
        <>
          <BottomNav />
          <DevToolbox />
        </>
      )}
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
