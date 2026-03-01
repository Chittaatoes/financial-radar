import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Shield,
  ShieldCheck,
  Lock,
  TrendingUp,
  Award,
  LogOut,
  Globe,
  Moon,
  Sun,
  User,
  BarChart3,
  Heart,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/components/theme-provider";
import { getTierKey } from "@/lib/constants";

import { ProfileAuthorFooter } from "@/components/profile-author-footer";
import { getSoundEnabled, setSoundEnabled, playSound } from "@/hooks/use-sound";
import type { UserProfile } from "@shared/schema";



export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pt = (t as any).profile;
  const nt = t.nav;
  const [soundOn, setSoundOn] = useState(() => getSoundEnabled());

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const tierKey = getTierKey(level);
  const tierName = (t.tiers as any)[tierKey] ?? tierKey;

  const displayName = user?.firstName
    || (user as any)?.email
    || pt.guest;

  const insightLinks = [
    {
      key: "score",
      icon: BarChart3,
      title: nt.score,
      desc: pt.financeScoreDesc,
      path: "/score",
    },
    {
      key: "debt",
      icon: Shield,
      title: nt.debtHealth,
      desc: pt.debtHealthDesc,
      path: "/debt",
    },
    {
      key: "networth",
      icon: TrendingUp,
      title: nt.netWorth,
      desc: pt.netWorthDesc,
      path: "/networth",
    },
    {
      key: "achievements",
      icon: Award,
      title: nt.achievements,
      desc: pt.achievementsDesc,
      path: "/achievements",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-2 space-y-5 max-w-lg mx-auto">
      <h1 className="text-lg font-serif font-bold" data-testid="text-profile-title">
        {pt.title}
      </h1>

      <Card className="rounded-2xl p-4 shadow-sm" data-testid="card-account">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {pt.account}
        </p>
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.profileImageUrl || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user?.firstName?.[0] || <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" data-testid="text-profile-name">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-profile-tier">
              {tierName} &middot; Lv {level}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min((xp % 100), 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground" data-testid="text-profile-xp">
            {xp} XP
          </span>
        </div>

        {user?.isGuest && (
          <div className="mt-4 pt-3 border-t border-border/50" data-testid="card-secure-account">
            <div className="flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground/80">Progress belum disimpan ke cloud</p>
                <p className="text-[11px] text-muted-foreground/55 mt-0.5">
                  Tautkan agar level &amp; target tidak hilang.
                </p>
                <button
                  className="mt-2 flex items-center gap-0.5 text-xs text-primary/80 font-medium hover:text-primary transition-colors"
                  onClick={() => { window.location.href = "/api/login"; }}
                  data-testid="profile-button-secure-google"
                >
                  Tautkan dengan Google
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {user && !user.isGuest && (
          <div className="mt-4 pt-3 border-t border-border/50" data-testid="card-account-linked">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary/60 shrink-0" />
              <p className="text-xs text-primary/70">Akun Terhubung · Progress Anda sudah aman</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {pt.financialOverview}
        </p>
        <div className="divide-y">
          {insightLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.key} href={item.path}>
                <button
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/40 transition-colors rounded-lg px-1"
                  data-testid={`profile-link-${item.key}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              </Link>
            );
          })}
        </div>
      </Card>

      <a
        href="https://saweria.co/chittaatoes"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Card
          className="rounded-2xl py-4 px-4 shadow-sm hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
          data-testid="card-support-developer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Dukung Pengembang</p>
              <p className="text-xs text-muted-foreground/70">
                Dukungan Anda sangat berarti. Tanpa iklan, tanpa paywall, murni sukarela.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </Card>
      </a>

      <Card className="rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {pt.settings}
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>{t.common.language}</span>
            </div>
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 text-xs font-semibold transition-colors ${
                  language === "en"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
                data-testid="profile-lang-en"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("id")}
                className={`px-3 py-1 text-xs font-semibold transition-colors ${
                  language === "id"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
                data-testid="profile-lang-id"
              >
                ID
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {theme === "dark" ? (
                <Moon className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Sun className="w-4 h-4 text-muted-foreground" />
              )}
              <span>{theme === "dark" ? pt.darkMode : pt.lightMode}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleTheme}
              className="h-7 rounded-lg text-xs"
              data-testid="profile-theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {soundOn ? (
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
              <span>{pt.soundEffects}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setSoundEnabled(next);
                if (next) playSound("xp");
              }}
              className="h-7 rounded-lg text-xs"
              data-testid="profile-sound-toggle"
            >
              {soundOn ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {(profile as any)?.role === "admin" && (
        <Link href="/admin" className="block mt-2">
          <Card
            className="rounded-2xl py-3 px-4 shadow-sm hover:scale-[1.02] transition-transform duration-200 cursor-pointer border-primary/20"
            data-testid="profile-link-admin"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{nt.admin}</p>
                <p className="text-xs text-muted-foreground/70">{pt.adminDesc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </Card>
        </Link>
      )}
      
      <Button
            variant="ghost"
            onClick={() => logout()}
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl h-11"
            data-testid="profile-button-logout"
          >
        <LogOut className="w-4 h-4 mr-2" />
        {t.auth.logout}
      </Button>

      <ProfileAuthorFooter />
    </div>
  );
}
