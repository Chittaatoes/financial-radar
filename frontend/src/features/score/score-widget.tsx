import { useQuery } from "@tanstack/react-query";
import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Wallet, Shield, Flame, Lightbulb, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useLocation } from "wouter";

interface FinanceScore {
  totalScore: number;
  warmingUp?: boolean;
  title: string;
  tier: string;
  breakdown: {
    spending: number;
    wealth: number;
    debt: number;
    consistency: number;
  };
}

const BREAKDOWN_KEYS = ["spending", "wealth", "debt", "consistency"] as const;
type BreakdownKey = typeof BREAKDOWN_KEYS[number];

const BREAKDOWN_META: Record<BreakdownKey, {
  max: number;
  icon: typeof Wallet;
  accentColor: string;
  ringColor: string;
  tKey: string;
}> = {
  spending: {
    max: 25, icon: Wallet,
    accentColor: "text-cyan-500",
    ringColor: "#06b6d4",
    tKey: "spendingControl",
  },
  wealth: {
    max: 25, icon: TrendingUp,
    accentColor: "text-emerald-500",
    ringColor: "#10b981",
    tKey: "wealthGrowth",
  },
  debt: {
    max: 20, icon: Shield,
    accentColor: "text-rose-500",
    ringColor: "#f43f5e",
    tKey: "debtHealth",
  },
  consistency: {
    max: 15, icon: Flame,
    accentColor: "text-fuchsia-500",
    ringColor: "#d946ef",
    tKey: "consistency",
  },
};

function SvgMiniRing({ cx, cy, value, max, color, r = 32, strokeW = 4.5, delay = 0 }: {
  cx: number; cy: number; value: number; max: number; color: string; r?: number; strokeW?: number; delay?: number;
}) {
  const innerR = r - strokeW / 2;
  const circ = 2 * Math.PI * innerR;
  const prog = (value / max) * circ;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="fill-background" />
      <circle cx={cx} cy={cy} r={innerR} fill="none" className="stroke-border" strokeWidth={strokeW} opacity={0.5} />
      <motion.circle
        cx={cx} cy={cy} r={innerR}
        fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
        strokeDasharray={circ}
        transform={`rotate(-90 ${cx} ${cy})`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - prog }}
        transition={{ duration: 1, ease: "easeOut", delay }}
      />
      <motion.text
        x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        className="fill-foreground font-mono font-bold" fontSize={r * 0.65}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.4 }}
      >{value}</motion.text>
    </g>
  );
}

function AnimatedCounter({ value, duration = 1.5, delay = 0.5 }: { value: number; duration?: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, value, { duration, delay, ease: "easeOut", onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => ctrl.stop();
  }, [value, duration, delay]);
  return <span>{display}</span>;
}

function getTierColor(tier: string) {
  switch (tier) {
    case "Diamond": return "text-violet-500 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800";
    case "Platinum": return "text-slate-500 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800";
    case "Gold": return "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
    case "Silver": return "text-gray-500 bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800";
    default: return "text-orange-700 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800";
  }
}

function getImproveTips(breakdown: FinanceScore["breakdown"], lang: string): string[] {
  const tips: string[] = [];
  const isId = lang === "id";
  if (breakdown.spending < 20) tips.push(isId ? "Coba jaga pengeluaran di bawah 70% dari pendapatan" : "Try to keep spending below 70% of your income");
  if (breakdown.wealth < 15) tips.push(isId ? "Buat target tabungan dan rutin menabung" : "Set up a savings goal and make regular deposits");
  if (breakdown.debt < 15) tips.push(isId ? "Fokus mengurangi rasio utang terhadap pendapatan" : "Focus on reducing your debt-to-income ratio");
  if (breakdown.consistency < 10) tips.push(isId ? "Catat transaksi harian untuk membangun streak" : "Log your transactions daily to build your streak");
  if (tips.length === 0) tips.push(isId ? "Bagus! Terus jaga kebiasaan keuangan Anda" : "Great job! Keep maintaining your financial habits");
  return tips;
}

export function ScoreWidget() {
  const { t, language } = useLanguage();
  const scoreT = t.score as Record<string, string>;
  const [, setLocation] = useLocation();

  const { data: score, isLoading } = useQuery<FinanceScore>({
    queryKey: ["/api/finance-score"],
  });

  if (isLoading || !score) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded-xl bg-muted animate-pulse" />
        <div className="h-64 bg-transparent animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  const tips = getImproveTips(score.breakdown, language);
  const tierColorClass = getTierColor(score.tier);
  const isWarmingUp = score.warmingUp === true;

  const pctPerComponent: Record<BreakdownKey, number> = {
    spending: Math.round((score.breakdown.spending / 25) * 100),
    wealth: Math.round((score.breakdown.wealth / 25) * 100),
    debt: Math.round((score.breakdown.debt / 20) * 100),
    consistency: Math.round((score.breakdown.consistency / 15) * 100),
  };

  const spendingLabel = scoreT.spendingControl || "Spending Control";
  const savingsLabel = scoreT.wealthGrowth || "Wealth Growth";
  const investmentsLabel = scoreT.consistency || "Consistency";
  const debtsLabel = scoreT.debtHealth || "Debt Health";

  return (
    <div className="space-y-4" data-testid="score-widget">
      <h2 className="text-lg font-serif font-bold" data-testid="text-score-page-title">
        {scoreT.title}
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center"
      >
        <svg viewBox="0 0 380 380" className="w-full max-w-[400px]" data-testid="svg-diamond-radar">
          <defs>
            <path id="curveTop" d="M 120,52 A 250,250 0 0,1 260,52" fill="none" />
            <path id="curveBottom" d="M 130,332 A 250,250 0 0,0 250,332" fill="none" />
            <path id="curveLeft" d="M 48,260 A 250,250 0 0,1 48,120" fill="none" />
            <path id="curveRight" d="M 332,120 A 250,250 0 0,1 332,260" fill="none" />
          </defs>

          <motion.text className="fill-muted-foreground" fontSize={11} fontWeight={600} letterSpacing={3}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            data-testid="label-spending">
            <textPath href="#curveTop" startOffset="50%" textAnchor="middle">{spendingLabel}</textPath>
          </motion.text>

          <motion.text className="fill-muted-foreground" fontSize={11} fontWeight={600} letterSpacing={3}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
            data-testid="label-savings">
            <textPath href="#curveBottom" startOffset="50%" textAnchor="middle">{savingsLabel}</textPath>
          </motion.text>

          <motion.text className="fill-muted-foreground" fontSize={10} fontWeight={600} letterSpacing={2}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}
            data-testid="label-investments">
            <textPath href="#curveLeft" startOffset="50%" textAnchor="middle">{investmentsLabel}</textPath>
          </motion.text>

          <motion.text className="fill-muted-foreground" fontSize={10} fontWeight={600} letterSpacing={2}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            data-testid="label-debts">
            <textPath href="#curveRight" startOffset="50%" textAnchor="middle">{debtsLabel}</textPath>
          </motion.text>

          <SvgMiniRing cx={190} cy={90} value={score.breakdown.spending} max={25}
            color={BREAKDOWN_META.spending.ringColor} r={34} delay={0.3} />

          <SvgMiniRing cx={292} cy={190} value={score.breakdown.debt} max={20}
            color={BREAKDOWN_META.debt.ringColor} r={34} delay={0.45} />

          <SvgMiniRing cx={190} cy={290} value={score.breakdown.wealth} max={25}
            color={BREAKDOWN_META.wealth.ringColor} r={34} delay={0.6} />

          <SvgMiniRing cx={88} cy={190} value={score.breakdown.consistency} max={15}
            color={BREAKDOWN_META.consistency.ringColor} r={34} delay={0.5} />

          <motion.text x={190} y={180} textAnchor="middle" dominantBaseline="central"
            className="fill-foreground font-mono" fontSize={56} fontWeight={800}
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            data-testid="text-total-score"
          >{isWarmingUp && score.totalScore === 0 ? "--" : score.totalScore}</motion.text>

          <motion.text x={190} y={218} textAnchor="middle"
            className="fill-muted-foreground font-mono" fontSize={14}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >/ 100</motion.text>
        </svg>
      </motion.div>

      {isWarmingUp && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 bg-amber-50/80 dark:bg-amber-950/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-amber-700 dark:text-amber-400" data-testid="text-warming-up">
                {scoreT.warmingUp || "Start logging transactions to get your score."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="px-5 py-3.5 flex items-center gap-4" data-testid="card-tier-info">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${tierColorClass}`} data-testid="badge-tier">
              <TrendingUp className="w-3.5 h-3.5" />
              {score.tier}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground" data-testid="text-score-title-label">{score.title}</p>
              <p className="text-xs text-muted-foreground">{score.tier} Tier</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {BREAKDOWN_KEYS.map((key, i) => {
          const meta = BREAKDOWN_META[key];
          const Icon = meta.icon;
          const value = score.breakdown[key];
          const pct = pctPerComponent[key];
          return (
            <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.1, duration: 0.4 }}>
              <Card className="border-0 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-3.5 space-y-2" data-testid={`card-score-${key}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${meta.accentColor}`} />
                      <span className="text-xs text-muted-foreground">{scoreT[meta.tKey]}</span>
                    </div>
                    <motion.span className={`text-[10px] font-semibold ${meta.accentColor}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: 1.3 + i * 0.1 }} data-testid={`text-pct-${key}`}
                    >{pct}%</motion.span>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold font-mono text-foreground" data-testid={`text-value-${key}`}>
                      <AnimatedCounter value={value} delay={1.1 + i * 0.1} duration={0.8} />
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">/{meta.max}</span>
                  </div>
                  <div className="h-1.5 bg-muted/50 dark:bg-muted/30 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ backgroundColor: meta.ringColor }}
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 1.2 + i * 0.1, ease: "easeOut" }}
                      data-testid={`bar-${key}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <Card className="border-0 bg-primary/5 dark:bg-primary/10 cursor-pointer transition-colors"
          data-testid="card-tips">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{tips.length} {scoreT.tips || "Tips"}</span>{" "}
                  <span className="text-muted-foreground">{scoreT.tipsDesc || "to boost your finance score"}</span>
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}>
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">{scoreT.howToImprove}</p>
            {tips.map((tip, i) => (
              <motion.div key={i} className="flex items-start gap-2.5"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8 + i * 0.1 }}>
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground">{tip}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
