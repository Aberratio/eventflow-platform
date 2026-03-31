import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { CookieConsent } from "@/components/CookieConsent";
import { BottomNav } from "@/components/layout/BottomNav";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import ServiceUnavailable from "./pages/ServiceUnavailable";
import Forbidden from "./pages/Forbidden";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import EventsPage from "./pages/EventsPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import EventRegistrationPage from "./pages/EventRegistrationPage";
import RegistrationSuccessPage from "./pages/RegistrationSuccessPage";
import LiveResultsPage from "./pages/LiveResultsPage";

import { DynamicInfoPage } from './components/info/DynamicInfoPage';
import SeriesListPage from "./pages/SeriesListPage";
import SeriesDetailsPage from "./pages/SeriesDetailsPage";
import ShopPage from "./pages/ShopPage";
import ShopProductPage from "./pages/ShopProductPage";
import CartPage from "./pages/CartPage";
import ParticipantDashboard from "./pages/participant/ParticipantDashboard";
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import EventForm from "./pages/organizer/EventForm";
import EventManage from "./pages/organizer/EventManage";
import OrganizerEventsPage from "./pages/organizer/OrganizerEventsPage";
import ModeratorDashboard from "./pages/moderator/ModeratorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminEventManage } from "./pages/admin/components/AdminEventManage";
import { PageEditorPage } from "./pages/admin/components/PageEditorPage";
import { AdminProductEditPage } from "./pages/admin/components/AdminProductEditPage";
import { AdminOrderEditPage } from "./pages/admin/components/AdminOrderEditPage";
import { AdminChallengeEditPage } from "./pages/admin/components/AdminChallengeEditPage";
import { AdminPartnerEditPage } from "./pages/admin/components/AdminPartnerEditPage";
import AthleteProfilePage from "./pages/AthleteProfilePage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import NotificationsPage from "./pages/NotificationsPage";
import ChallengesListPage from "./pages/ChallengesListPage";
import ChallengeDetailsPage from "./pages/ChallengeDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import EventRegistrationEmbed from "./pages/EventRegistrationEmbed";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
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
                  <Route path="/wydarzenia" element={<EventsPage />} />
                  <Route path="/wyniki/live" element={<LiveResultsPage />} />
                  
                  {/* Dynamic info pages - jedna trasa dla wszystkich stron informacyjnych */}
                  <Route path="/info/:slug" element={<DynamicInfoPage />} />
                  
                  <Route path="/logowanie" element={<LoginPage />} />
                  <Route path="/rejestracja" element={<RegisterPage />} />
                  <Route path="/sklep" element={<ShopPage />} />
                  {/* English routes (keep for compatibility) */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/:slug" element={<EventDetailsPage />} />
                  <Route path="/events/:slug/register" element={<EventRegistrationPage />} />
                  <Route path="/events/:slug/embed" element={<EventRegistrationEmbed />} />
                  <Route path="/events/:slug/register/success" element={<RegistrationSuccessPage />} />
                  
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
                  <Route path="/admin/shop/products/:id/edit" element={<AdminProductEditPage />} />
                  <Route path="/admin/pages/new" element={<PageEditorPage />} />
                  <Route path="/admin/pages/:pageId/edit" element={<PageEditorPage />} />
                  <Route path="/admin/orders/:id/edit" element={<AdminOrderEditPage />} />
                  <Route path="/admin/challenges/new" element={<AdminChallengeEditPage />} />
                  <Route path="/admin/challenges/:id/edit" element={<AdminChallengeEditPage />} />
                  <Route path="/admin/partners/new" element={<AdminPartnerEditPage />} />
                  <Route path="/admin/partners/:id/edit" element={<AdminPartnerEditPage />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="/500" element={<ServerError />} />
                  <Route path="/503" element={<ServiceUnavailable />} />
                  <Route path="/403" element={<Forbidden />} />
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
);

export default App;
