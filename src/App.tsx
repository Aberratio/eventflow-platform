import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import EventsPage from "./pages/EventsPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import EventRegistrationPage from "./pages/EventRegistrationPage";
import ResultsPage from "./pages/ResultsPage";
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
import AthleteProfilePage from "./pages/AthleteProfilePage";
import AthletesPage from "./pages/AthletesPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:slug" element={<EventDetailsPage />} />
              <Route path="/events/:slug/register" element={<EventRegistrationPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/series" element={<SeriesListPage />} />
              <Route path="/series/:slug" element={<SeriesDetailsPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/shop/:slug" element={<ShopProductPage />} />
<Route path="/cart" element={<CartPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/athlete/:userId" element={<AthleteProfilePage />} />
              <Route path="/athletes" element={<AthletesPage />} />
              <Route path="/participant" element={<ParticipantDashboard />} />
              <Route path="/participant/*" element={<ParticipantDashboard />} />
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/organizer/events/new" element={<EventForm />} />
              <Route path="/organizer/events/:id" element={<EventManage />} />
              <Route path="/organizer/events/:id/edit" element={<EventForm />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/events/:id" element={<AdminEventManage />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
