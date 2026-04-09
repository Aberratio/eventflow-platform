import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { OnboardingDialog } from '@/components/OnboardingDialog';
import { CookieConsent } from '@/components/CookieConsent';
import { BottomNav } from '@/components/layout/BottomNav';
import { ScrollToTop } from './components/ScrollToTop';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/errors';

// ─── Eagerly loaded (critical path) ───────────────────────
import Index from './pages/Index';
import NotFound from './pages/NotFound';

// ─── Lazy-loaded pages (code-split) ──────────────────────
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const EventRegistrationPage = lazy(() => import('./pages/EventRegistrationPage'));
const EventRegistrationEmbed = lazy(() => import('./pages/EventRegistrationEmbed'));
const RegistrationSuccessPage = lazy(() => import('./pages/RegistrationSuccessPage'));
const LiveResultsPage = lazy(() => import('./pages/LiveResultsPage'));
const SeriesListPage = lazy(() => import('./pages/SeriesListPage'));
const SeriesDetailsPage = lazy(() => import('./pages/SeriesDetailsPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ShopProductPage = lazy(() => import('./pages/ShopProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const AthleteProfilePage = lazy(() => import('./pages/AthleteProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChallengesListPage = lazy(() => import('./pages/ChallengesListPage'));
const ChallengeDetailsPage = lazy(() => import('./pages/ChallengeDetailsPage'));
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
  import('./pages/admin/components/AdminEventManage').then((m) => ({ default: m.AdminEventManage })),
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
const AdminPartnerEditPage = lazy(() =>
  import('./pages/admin/components/AdminPartnerEditPage').then((m) => ({
    default: m.AdminPartnerEditPage,
  })),
);
const DynamicInfoPage = lazy(() =>
  import('./components/info/DynamicInfoPage').then((m) => ({ default: m.DynamicInfoPage })),
);

// ─── Route loading fallback ──────────────────────────────
const PageLoader = () => (
  <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-12">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-72" />
    <div className="mt-6 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="hidden h-48 rounded-xl lg:block" />
    </div>
  </div>
);

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

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <OnboardingDialog />
              <CookieConsent />
              <div className="pb-16 md:pb-0">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    {/* Polish routes */}
                    <Route path="/wydarzenia" element={<EventsPage />} />
                    <Route path="/wyniki/live" element={<LiveResultsPage />} />
                    <Route path="/info/:slug" element={<DynamicInfoPage />} />
                    <Route path="/logowanie" element={<LoginPage />} />
                    <Route path="/rejestracja" element={<RegisterPage />} />
                    <Route path="/sklep" element={<ShopPage />} />
                    {/* English routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/events/:slug" element={<EventDetailsPage />} />
                    <Route path="/events/:slug/register" element={<EventRegistrationPage />} />
                    <Route path="/events/:slug/embed" element={<EventRegistrationEmbed />} />
                    <Route
                      path="/events/:slug/register/success"
                      element={<RegistrationSuccessPage />}
                    />
                    <Route path="/series" element={<SeriesListPage />} />
                    <Route path="/series/:slug" element={<SeriesDetailsPage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/shop/:slug" element={<ShopProductPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/order-success" element={<OrderSuccessPage />} />
                    <Route path="/athlete/:userId" element={<AthleteProfilePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/challenges" element={<ChallengesListPage />} />
                    <Route path="/challenges/:slug" element={<ChallengeDetailsPage />} />
                    <Route path="/participant" element={<ParticipantDashboard />} />
                    <Route path="/participant/*" element={<ParticipantDashboard />} />
                    <Route path="/organizer" element={<OrganizerDashboard />} />
                    <Route path="/organizer/events" element={<OrganizerEventsPage />} />
                    <Route path="/organizer/events/new" element={<EventForm />} />
                    <Route path="/organizer/events/:id" element={<EventManage />} />
                    <Route path="/organizer/events/:id/edit" element={<EventForm />} />
                    <Route path="/moderator" element={<ModeratorDashboard />} />
                    <Route path="/moderator/events/:id" element={<EventManage />} />
                    <Route path="/moderator/*" element={<ModeratorDashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/events/:id" element={<AdminEventManage />} />
                    <Route path="/admin/shop/products/new" element={<AdminProductEditPage />} />
                    <Route
                      path="/admin/shop/products/:id/edit"
                      element={<AdminProductEditPage />}
                    />
                    <Route path="/admin/pages/new" element={<PageEditorPage />} />
                    <Route path="/admin/pages/:pageId/edit" element={<PageEditorPage />} />
                    <Route path="/admin/orders/:id/edit" element={<AdminOrderEditPage />} />
                    <Route path="/admin/challenges/new" element={<AdminChallengeEditPage />} />
                    <Route
                      path="/admin/challenges/:id/edit"
                      element={<AdminChallengeEditPage />}
                    />
                    <Route path="/admin/partners/new" element={<AdminPartnerEditPage />} />
                    <Route path="/admin/partners/:id/edit" element={<AdminPartnerEditPage />} />
                    <Route path="/admin/*" element={<AdminDashboard />} />
                    <Route path="/404" element={<NotFound />} />
                    <Route path="/500" element={<ServerError />} />
                    <Route path="/503" element={<ServiceUnavailable />} />
                    <Route path="/403" element={<Forbidden />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <BottomNav />
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
