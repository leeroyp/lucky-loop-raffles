import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Raffles from "./pages/Raffles";
import RaffleDetail from "./pages/RaffleDetail";
import Account from "./pages/Account";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateRaffle from "./pages/admin/CreateRaffle";
import ManageRaffle from "./pages/admin/ManageRaffle";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/raffles" element={<Raffles />} />
            <Route path="/raffles/:id" element={<RaffleDetail />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/raffles/new" element={<CreateRaffle />} />
            <Route path="/admin/raffles/:id" element={<ManageRaffle />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
