import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import Raffles from "./pages/Raffles";
import RaffleDetail from "./pages/RaffleDetail";
import HowItWorks from "./pages/HowItWorks";
import Account from "./pages/Account";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateRaffle from "./pages/admin/CreateRaffle";
import ManageRaffle from "./pages/admin/ManageRaffle";
import Analytics from "./pages/admin/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/raffles" element={<Raffles />} />
                <Route path="/raffles/:id" element={<RaffleDetail />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/account" element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/raffles/new" element={
                  <ProtectedRoute requireAdmin>
                    <CreateRaffle />
                  </ProtectedRoute>
                } />
                <Route path="/admin/raffles/:id" element={
                  <ProtectedRoute requireAdmin>
                    <ManageRaffle />
                  </ProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <ProtectedRoute requireAdmin>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;