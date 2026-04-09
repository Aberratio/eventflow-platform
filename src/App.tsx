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
const SkeletonShowcase = lazy(() => import('./pages/SkeletonShowcase'));

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

// ─── Typed Suspense wrapper ──────────────────────────────
const Lazy = ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => (
  <Suspense fallback={fallback}>{children}</Suspense>
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
                  <Routes>
                    <Route path="/" element={<Index />} />
                    {/* Polish routes */}
                    <Route path="/wydarzenia" element={<Lazy fallback={<EventsPageSkeleton />}><EventsPage /></Lazy>} />
                    <Route path="/wyniki/live" element={<Lazy fallback={<EventsPageSkeleton />}><LiveResultsPage /></Lazy>} />
                    <Route path="/info/:slug" element={<Lazy fallback={<EventDetailsSkeleton />}><DynamicInfoPage /></Lazy>} />
                    <Route path="/logowanie" element={<Lazy fallback={<AuthPageSkeleton />}><LoginPage /></Lazy>} />
                    <Route path="/rejestracja" element={<Lazy fallback={<AuthPageSkeleton />}><RegisterPage /></Lazy>} />
                    <Route path="/sklep" element={<Lazy fallback={<ShopPageSkeleton />}><ShopPage /></Lazy>} />
                    {/* English routes */}
                    <Route path="/login" element={<Lazy fallback={<AuthPageSkeleton />}><LoginPage /></Lazy>} />
                    <Route path="/register" element={<Lazy fallback={<AuthPageSkeleton />}><RegisterPage /></Lazy>} />
                    <Route path="/forgot-password" element={<Lazy fallback={<AuthPageSkeleton />}><ForgotPasswordPage /></Lazy>} />
                    <Route path="/reset-password" element={<Lazy fallback={<AuthPageSkeleton />}><ResetPasswordPage /></Lazy>} />
                    <Route path="/events" element={<Lazy fallback={<EventsPageSkeleton />}><EventsPage /></Lazy>} />
                    <Route path="/events/:slug" element={<Lazy fallback={<EventDetailsSkeleton />}><EventDetailsPage /></Lazy>} />
                    <Route path="/events/:slug/register" element={<Lazy fallback={<FormPageSkeleton />}><EventRegistrationPage /></Lazy>} />
                    <Route path="/events/:slug/embed" element={<Lazy fallback={<FormPageSkeleton />}><EventRegistrationEmbed /></Lazy>} />
                    <Route path="/events/:slug/register/success" element={<Lazy fallback={<EventDetailsSkeleton />}><RegistrationSuccessPage /></Lazy>} />
                    <Route path="/series" element={<Lazy fallback={<ListPageSkeleton />}><SeriesListPage /></Lazy>} />
                    <Route path="/series/:slug" element={<Lazy fallback={<EventDetailsSkeleton />}><SeriesDetailsPage /></Lazy>} />
                    <Route path="/shop" element={<Lazy fallback={<ShopPageSkeleton />}><ShopPage /></Lazy>} />
                    <Route path="/shop/:slug" element={<Lazy fallback={<EventDetailsSkeleton />}><ShopProductPage /></Lazy>} />
                    <Route path="/cart" element={<Lazy fallback={<ShopPageSkeleton />}><CartPage /></Lazy>} />
                    <Route path="/order-success" element={<Lazy fallback={<FormPageSkeleton />}><OrderSuccessPage /></Lazy>} />
                    <Route path="/athlete/:userId" element={<Lazy fallback={<ProfilePageSkeleton />}><AthleteProfilePage /></Lazy>} />
                    <Route path="/notifications" element={<Lazy fallback={<DashboardSkeleton />}><NotificationsPage /></Lazy>} />
                    <Route path="/profile" element={<Lazy fallback={<ProfilePageSkeleton />}><ProfilePage /></Lazy>} />
                    <Route path="/challenges" element={<Lazy fallback={<ListPageSkeleton />}><ChallengesListPage /></Lazy>} />
                    <Route path="/challenges/:slug" element={<Lazy fallback={<EventDetailsSkeleton />}><ChallengeDetailsPage /></Lazy>} />
                    <Route path="/participant" element={<Lazy fallback={<DashboardSkeleton />}><ParticipantDashboard /></Lazy>} />
                    <Route path="/participant/*" element={<Lazy fallback={<DashboardSkeleton />}><ParticipantDashboard /></Lazy>} />
                    <Route path="/organizer" element={<Lazy fallback={<DashboardSkeleton />}><OrganizerDashboard /></Lazy>} />
                    <Route path="/organizer/events" element={<Lazy fallback={<EventsPageSkeleton />}><OrganizerEventsPage /></Lazy>} />
                    <Route path="/organizer/events/new" element={<Lazy fallback={<FormPageSkeleton />}><EventForm /></Lazy>} />
                    <Route path="/organizer/events/:id" element={<Lazy fallback={<DashboardSkeleton />}><EventManage /></Lazy>} />
                    <Route path="/organizer/events/:id/edit" element={<Lazy fallback={<FormPageSkeleton />}><EventForm /></Lazy>} />
                    <Route path="/moderator" element={<Lazy fallback={<DashboardSkeleton />}><ModeratorDashboard /></Lazy>} />
                    <Route path="/moderator/events/:id" element={<Lazy fallback={<DashboardSkeleton />}><EventManage /></Lazy>} />
                    <Route path="/moderator/*" element={<Lazy fallback={<DashboardSkeleton />}><ModeratorDashboard /></Lazy>} />
                    <Route path="/admin" element={<Lazy fallback={<AdminDashboardSkeleton />}><AdminDashboard /></Lazy>} />
                    <Route path="/admin/events/:id" element={<Lazy fallback={<DashboardSkeleton />}><AdminEventManage /></Lazy>} />
                    <Route path="/admin/shop/products/new" element={<Lazy fallback={<FormPageSkeleton />}><AdminProductEditPage /></Lazy>} />
                    <Route path="/admin/shop/products/:id/edit" element={<Lazy fallback={<FormPageSkeleton />}><AdminProductEditPage /></Lazy>} />
                    <Route path="/admin/pages/new" element={<Lazy fallback={<FormPageSkeleton />}><PageEditorPage /></Lazy>} />
                    <Route path="/admin/pages/:pageId/edit" element={<Lazy fallback={<FormPageSkeleton />}><PageEditorPage /></Lazy>} />
                    <Route path="/admin/orders/:id/edit" element={<Lazy fallback={<FormPageSkeleton />}><AdminOrderEditPage /></Lazy>} />
                    <Route path="/admin/challenges/new" element={<Lazy fallback={<FormPageSkeleton />}><AdminChallengeEditPage /></Lazy>} />
                    <Route path="/admin/challenges/:id/edit" element={<Lazy fallback={<FormPageSkeleton />}><AdminChallengeEditPage /></Lazy>} />
                    <Route path="/admin/partners/new" element={<Lazy fallback={<FormPageSkeleton />}><AdminPartnerEditPage /></Lazy>} />
                    <Route path="/admin/partners/:id/edit" element={<Lazy fallback={<FormPageSkeleton />}><AdminPartnerEditPage /></Lazy>} />
                    <Route path="/admin/*" element={<Lazy fallback={<AdminDashboardSkeleton />}><AdminDashboard /></Lazy>} />
                    <Route path="/404" element={<NotFound />} />
                    <Route path="/500" element={<Lazy fallback={<EventsPageSkeleton />}><ServerError /></Lazy>} />
                    <Route path="/503" element={<Lazy fallback={<EventsPageSkeleton />}><ServiceUnavailable /></Lazy>} />
                    <Route path="/403" element={<Lazy fallback={<EventsPageSkeleton />}><Forbidden /></Lazy>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
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
