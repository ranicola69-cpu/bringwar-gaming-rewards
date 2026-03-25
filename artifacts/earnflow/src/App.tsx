import "./lib/fetch-override"; // Global fetch override for Auth token MUST be first
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import OffersWall from "@/pages/offers/index";
import OfferDetail from "@/pages/offers/detail";
import MyCompletions from "@/pages/completions";
import Withdrawals from "@/pages/withdrawals";
import AdminDashboard from "@/pages/admin/index";
import EarnHub from "@/pages/earn/index";
import Surveys from "@/pages/surveys/index";
import OfferWalls from "@/pages/offer-walls/index";
import DailyBonus from "@/pages/daily-bonus/index";
import Referral from "@/pages/referral/index";
import LootBox from "@/pages/loot-box/index";
import SpinWheel from "@/pages/spin-wheel/index";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Protected Routes */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/earn"><ProtectedRoute component={EarnHub} /></Route>
      <Route path="/surveys"><ProtectedRoute component={Surveys} /></Route>
      <Route path="/offer-walls"><ProtectedRoute component={OfferWalls} /></Route>
      <Route path="/daily-bonus"><ProtectedRoute component={DailyBonus} /></Route>
      <Route path="/referral"><ProtectedRoute component={Referral} /></Route>
      <Route path="/loot-box"><ProtectedRoute component={LootBox} /></Route>
      <Route path="/spin-wheel"><ProtectedRoute component={SpinWheel} /></Route>
      <Route path="/offers"><ProtectedRoute component={OffersWall} /></Route>
      <Route path="/offers/:id"><ProtectedRoute component={OfferDetail} /></Route>
      <Route path="/my-completions"><ProtectedRoute component={MyCompletions} /></Route>
      <Route path="/withdrawals"><ProtectedRoute component={Withdrawals} /></Route>
      <Route path="/admin"><ProtectedRoute component={AdminDashboard} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
