import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageProvider } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import Onboarding from "@/features/onboarding/onboarding";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import Transactions from "@/pages/transactions";
import Goals from "@/pages/goals";
import DebtHealth from "@/pages/debt-health";
import NetWorth from "@/pages/net-worth";
import Achievements from "@/pages/achievements";
import ScorePage from "@/features/score/score-page";
import Admin from "@/pages/admin";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { MobileBottomNav } from "@/components/mobile-nav";
import { AddAction } from "@/components/add-action";
import { apiRequest } from "@/lib/queryClient";

function useOnboardingSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem("fr_onboarding");
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      apiRequest("POST", "/api/onboarding", data).then(() => {
        localStorage.removeItem("fr_onboarding");
      }).catch(() => {});
    } catch {
      localStorage.removeItem("fr_onboarding");
    }
  }, [user]);
}

function GlobalAddAction() {
  const [location, setLocation] = useLocation();

  if (location !== "/") return null;

  const handleSelectAction = (action: string) => {
    window.dispatchEvent(new CustomEvent("fr-open-action", { detail: action }));
  };

  return <AddAction onSelectAction={handleSelectAction} />;
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  useOnboardingSync();

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="hidden md:flex items-center justify-between gap-4 p-3 border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/accounts" component={Accounts} />
              <Route path="/transactions" component={Transactions} />
              <Route path="/goals" component={Goals} />
              <Route path="/debt" component={DebtHealth} />
              <Route path="/networth" component={NetWorth} />
              <Route path="/achievements" component={Achievements} />
              <Route path="/score" component={ScorePage} />
              <Route path="/admin" component={Admin} />
              <Route path="/profile" component={ProfilePage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
        <MobileBottomNav />
        <GlobalAddAction />
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Skeleton className="h-10 w-10 rounded-md mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user && showOnboarding) {
    return (
      <Onboarding
        onComplete={() => {
          localStorage.setItem("fr_onboarding_done", "1");
          setShowOnboarding(false);
        }}
      />
    );
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <AppContent />
    </TooltipProvider>
  );
}

export default App;