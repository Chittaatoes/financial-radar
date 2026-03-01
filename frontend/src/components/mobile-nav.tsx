import { useLocation, Link } from "wouter";
import { LayoutDashboard, ArrowLeftRight, Target, Wallet, User } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const NAV_ITEMS = [
  { key: "dashboard", path: "/", icon: LayoutDashboard },
  { key: "transactions", path: "/transactions", icon: ArrowLeftRight },
  { key: "goals", path: "/goals", icon: Target },
  { key: "accounts", path: "/accounts", icon: Wallet },
  { key: "profile", path: "/profile", icon: User },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const labels: Record<string, string> = {
    dashboard: t.nav.dashboard,
    transactions: t.nav.transactions,
    goals: t.nav.goals,
    accounts: t.nav.accounts,
    profile: (t.nav as any).profile || "Profile",
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.path}
              data-testid={`mobile-nav-${item.key}`}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-xl transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? "bg-primary/10" : ""
              }`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium leading-tight">{labels[item.key]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
