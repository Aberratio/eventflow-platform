import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { BottomNav } from "@/components/layout/BottomNav";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import EventsPage from "./pages/EventsPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import EventRegistrationPage from "./pages/EventRegistrationPage";
import RegistrationSuccessPage from "./pages/RegistrationSuccessPage";
import ResultsPage from "./pages/ResultsPage";
import ResultsCalendarPage from "./pages/ResultsCalendarPage";
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
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminEventManage } from "./pages/admin/components/AdminEventManage";
import { PageEditorPage } from "./pages/admin/components/PageEditorPage";
import AthleteProfilePage from "./pages/AthleteProfilePage";
import AthletesPage from "./pages/AthletesPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import NotificationsPage from "./pages/NotificationsPage";


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
              <OnboardingDialog />
              <div className="pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Index />} />
                  {/* Polish routes */}
                  <Route path="/wydarzenia" element={<EventsPage />} />
                  <Route path="/wyniki" element={<ResultsCalendarPage />} />
                  <Route path="/wyniki/live" element={<LiveResultsPage />} />
                  
                  {/* Dynamic info pages */}
                  <Route path="/info/:slug" element={<DynamicInfoPage />} />
                  
                  {/* Legacy info routes for backward compatibility */}
                  <Route path="/info/kontakt" element={<DynamicInfoPage />} />
                  <Route path="/info/oferta" element={<DynamicInfoPage />} />
                  <Route path="/info/ubezpieczenia" element={<DynamicInfoPage />} />
                  <Route path="/info/o-nas" element={<DynamicInfoPage />} />
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
                  <Route path="/events/:slug/register/success" element={<RegistrationSuccessPage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/series" element={<SeriesListPage />} />
                  <Route path="/series/:slug" element={<SeriesDetailsPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/shop/:slug" element={<ShopProductPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/order-success" element={<OrderSuccessPage />} />
                  <Route path="/athlete/:userId" element={<AthleteProfilePage />} />
                  <Route path="/athletes" element={<AthletesPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/participant" element={<ParticipantDashboard />} />
                  <Route path="/participant/*" element={<ParticipantDashboard />} />
                  <Route path="/organizer" element={<OrganizerDashboard />} />
                  <Route path="/organizer/events/new" element={<EventForm />} />
                  <Route path="/organizer/events/:id" element={<EventManage />} />
                  <Route path="/organizer/events/:id/edit" element={<EventForm />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/events/:id" element={<AdminEventManage />} />
                  <Route path="/admin/pages/new" element={<PageEditorPage />} />
                  <Route path="/admin/pages/:pageId/edit" element={<PageEditorPage />} />
                  <Route path="/admin/*" element={<AdminDashboard />} />
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
