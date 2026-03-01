import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { playSound } from "@/hooks/use-sound";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogContentBottomSheet, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, X, Trash2, Calendar, PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import type { Account, Transaction, CustomCategory } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format, subDays, startOfMonth, endOfMonth, parseISO, eachDayOfInterval } from "date-fns";
import { useLanguage } from "@/lib/i18n";
import { SetupFirstAccountModal } from "@/components/setup-first-account-modal";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const transactionFormSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
  category: z.string().optional(),
  note: z.string().optional(),
});

const typeConfig = {
  income: { icon: ArrowDownLeft, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", label: "Income" },
  expense: { icon: ArrowUpRight, color: "text-red-500 dark:text-red-400", bg: "bg-red-500/10", label: "Expense" },
  transfer: { icon: ArrowLeftRight, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10", label: "Transfer" },
};

function AddCategoryDialog({ categoryType, onClose }: { categoryType: string; onClose: () => void }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [name, setName] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { name: string; type: string }) =>
      apiRequest("POST", "/api/custom-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-categories"] });
      toast({ title: t.transactions.addCategory });
      setName("");
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">{t.transactions.categoryName}</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.transactions.categoryNamePlaceholder}
          data-testid="input-new-category"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} data-testid="button-cancel-category">{t.accounts.cancel}</Button>
        <Button
          onClick={() => mutation.mutate({ name, type: categoryType })}
          disabled={mutation.isPending || !name.trim()}
          data-testid="button-save-category"
        >
          {mutation.isPending ? "..." : t.transactions.categorySave}
        </Button>
      </div>
    </div>
  );
}

function TransactionForm({ accounts, onClose }: { accounts: Account[]; onClose: () => void }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  const { data: customCategories } = useQuery<CustomCategory[]>({
    queryKey: ["/api/custom-categories"],
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/custom-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-categories"] });
    },
  });

  const form = useForm({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "expense" as "income" | "expense" | "transfer",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      fromAccountId: "",
      toAccountId: "",
      category: "",
      note: "",
    },
  });

  const watchType = form.watch("type");
  const defaultCategories = watchType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const userCategories = customCategories?.filter(c => c.type === watchType) || [];

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof transactionFormSchema>) => {
      const payload: Record<string, unknown> = {
        type: data.type,
        amount: data.amount,
        date: data.date,
        category: data.category || null,
        note: data.note || null,
      };
      if (data.type === "expense" || data.type === "transfer") {
        payload.fromAccountId = data.fromAccountId ? parseInt(data.fromAccountId) : null;
      }
      if (data.type === "income" || data.type === "transfer") {
        payload.toAccountId = data.toAccountId ? parseInt(data.toAccountId) : null;
      }
      return apiRequest("POST", "/api/transactions", payload);
    },
    onSuccess: () => {
      playSound("transaction");
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Transaction recorded! +5 XP" });
      onClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Unauthorized", description: "Logging in again...", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
    },
  });

  const typeLabels: Record<string, string> = {
    income: t.transactions.income,
    expense: t.transactions.expense,
    transfer: t.transactions.transfer,
  };

  const watchFromId = form.watch("fromAccountId");
  const watchAmt = form.watch("amount");
  const selectedFromAcc = accounts.find(a => String(a.id) === watchFromId);
  const hasInsufficientBalance = selectedFromAcc && watchAmt &&
    (watchType === "expense" || watchType === "transfer") &&
    Number(watchAmt) > Number(selectedFromAcc.balance);

  if (accounts.length === 0) {
    return (
      <div className="px-6 max-md:px-6 md:px-0 py-8 text-center">
        <p className="text-sm text-muted-foreground">{t.transactions.noAccWarning}</p>
        <Button variant="ghost" onClick={onClose} className="mt-4">{t.accounts.cancel}</Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => {
        if (hasInsufficientBalance) {
          toast({ title: t.common.error, description: t.transactions.insufficientBalanceTx, variant: "destructive" });
          return;
        }
        mutation.mutate(data);
      })} className="flex flex-col max-md:flex-1 max-md:min-h-0">
        <div className="space-y-5 px-6 max-md:px-6 md:px-0 max-md:flex-1 max-md:overflow-y-auto max-md:pb-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.transactions.type}</FormLabel>
                <div className="flex rounded-md border border-border p-1 gap-1 bg-muted/40" role="group" aria-label={t.transactions.type}>
                  {(["income", "expense", "transfer"] as const).map((tp) => {
                    const cfg = typeConfig[tp];
                    return (
                      <button
                        key={tp}
                        type="button"
                        role="radio"
                        aria-checked={field.value === tp}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 rounded-sm py-2.5 text-sm font-medium transition-all duration-150",
                          field.value === tp
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground"
                        )}
                        onClick={() => field.onChange(tp)}
                        data-testid={`button-type-${tp}`}
                      >
                        <cfg.icon className="w-4 h-4" />
                        {typeLabels[tp]}
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.transactions.amount}</FormLabel>
                <FormControl>
                  <CurrencyInput
                    placeholder="0"
                    className="min-h-[48px] text-lg"
                    value={field.value}
                    onChange={field.onChange}
                    data-testid="input-tx-amount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.transactions.date}</FormLabel>
                <FormControl>
                  <Input type="date" className="min-h-[48px]" {...field} data-testid="input-tx-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(watchType === "expense" || watchType === "transfer") && (
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field }) => {
                const selected = accounts.find(a => String(a.id) === field.value);
                return (
                  <FormItem>
                    <FormLabel>{t.transactions.fromAccount}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[48px]" data-testid="select-from-account">
                          <SelectValue placeholder={t.transactions.selectAccount}>
                            {selected ? (
                              <span className="flex items-center gap-1">
                                <span>{selected.name}</span>
                                <span className="text-muted-foreground/70">({formatCurrency(Number(selected.balance))})</span>
                              </span>
                            ) : undefined}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name} ({formatCurrency(Number(a.balance))})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasInsufficientBalance && (
                      <p className="text-xs text-destructive mt-1" data-testid="text-tx-insufficient">
                        Saldo tidak mencukupi
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          {(watchType === "income" || watchType === "transfer") && (
            <FormField
              control={form.control}
              name="toAccountId"
              render={({ field }) => {
                const selected = accounts.find(a => String(a.id) === field.value);
                return (
                  <FormItem>
                    <FormLabel>{t.transactions.toAccount}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[48px]" data-testid="select-to-account">
                          <SelectValue placeholder={t.transactions.selectAccount}>
                            {selected ? (
                              <span className="flex items-center gap-1">
                                <span>{selected.name}</span>
                                <span className="text-muted-foreground/70">({formatCurrency(Number(selected.balance))})</span>
                              </span>
                            ) : undefined}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name} ({formatCurrency(Number(a.balance))})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          {watchType !== "transfer" && (
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <FormLabel>{t.transactions.category}</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddCategoryOpen(true)}
                      data-testid="button-add-category"
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {t.transactions.addCategory}
                    </Button>
                  </div>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="min-h-[48px]" data-testid="select-category">
                        <SelectValue placeholder={t.transactions.selectCategory} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{t.transactions.defaultCategories}</SelectLabel>
                        {defaultCategories.map((c) => (
                          <SelectItem key={c} value={c}>{(t.categories as Record<string, string>)[c] || c}</SelectItem>
                        ))}
                      </SelectGroup>
                      {userCategories.length > 0 && (
                        <>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>{t.transactions.customCategories}</SelectLabel>
                            {userCategories.map((c) => (
                              <SelectItem key={`custom-${c.id}`} value={c.name}>
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span>{c.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {userCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {userCategories.map((c) => (
                        <Badge key={c.id} variant="secondary" className="text-[10px] gap-1">
                          {c.name}
                          <button
                            type="button"
                            onClick={() => deleteCategoryMutation.mutate(c.id)}
                            className="ml-0.5"
                            data-testid={`button-delete-category-${c.id}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.transactions.note}</FormLabel>
                <FormControl>
                  <Textarea placeholder={t.transactions.notePlaceholder} className="resize-none min-h-[48px]" {...field} data-testid="input-tx-note" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="shrink-0 px-6 max-md:px-6 md:px-0 pt-4 pb-6 md:pb-0 max-md:border-t max-md:border-border flex flex-col gap-2 md:flex-row md:justify-end">
          <Button
            type="submit"
            disabled={mutation.isPending || !!hasInsufficientBalance}
            className="w-full md:w-auto min-h-[52px] max-md:min-h-[52px] md:min-h-[36px] text-base md:text-sm rounded-md md:order-2"
            data-testid="button-save-tx"
          >
            {mutation.isPending ? "..." : t.transactions.submit}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full md:w-auto min-h-[40px] max-md:min-h-[40px] md:min-h-[36px] text-sm text-muted-foreground md:order-1"
          >
            {t.accounts.cancel}
          </Button>
        </div>
      </form>

      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.transactions.addCategoryTitle}</DialogTitle>
            <DialogDescription>{t.transactions.addCategoryDesc}</DialogDescription>
          </DialogHeader>
          <AddCategoryDialog categoryType={watchType} onClose={() => setAddCategoryOpen(false)} />
        </DialogContent>
      </Dialog>
    </Form>
  );
}

type DateFilter = "last7" | "thisMonth" | "custom";

function SpendingChart({ transactions, t }: { transactions: { date: string; label: string; amount: number }[]; t: ReturnType<typeof useLanguage>["t"] }) {
  const hasAnySpending = transactions.some((d) => d.amount > 0);
  if (!transactions || transactions.length === 0 || !hasAnySpending) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
        {t.transactions.noSpendingPeriod}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={transactions}>
        <defs>
          <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(145 48% 32%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(145 48% 32%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          formatter={(value: number) => [formatCurrency(value), t.transactions.dailySpending]}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="hsl(145 48% 32%)"
          fill="url(#colorSpending)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Transactions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("last7");
  const [customStart, setCustomStart] = useState(() => format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const deleteTxMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/spending-insight") });
      toast({ title: t.transactions.deleted });
    },
    onError: (error: Error) => {
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
    },
  });

  const getAccountName = (id: number | null | undefined) => {
    if (!id || !accounts) return "—";
    return accounts.find((a) => a.id === id)?.name ?? "Unknown";
  };

  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    if (dateFilter === "last7") {
      return { start: format(subDays(now, 6), "yyyy-MM-dd"), end: todayStr };
    } else if (dateFilter === "thisMonth") {
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end: todayStr };
    }
    const safeStart = customStart || todayStr;
    const safeEnd = customEnd || todayStr;
    return safeStart <= safeEnd ? { start: safeStart, end: safeEnd } : { start: safeEnd, end: safeStart };
  }, [dateFilter, customStart, customEnd]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((tx) => tx.date >= dateRange.start && tx.date <= dateRange.end);
  }, [transactions, dateRange]);

  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: parseISO(dateRange.start),
      end: parseISO(dateRange.end),
    });
    const expenseMap: Record<string, number> = {};
    filteredTransactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        expenseMap[tx.date] = (expenseMap[tx.date] || 0) + parseFloat(String(tx.amount));
      });
    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      return {
        date: dateStr,
        label: format(day, "dd MMM"),
        amount: expenseMap[dateStr] || 0,
      };
    });
  }, [filteredTransactions, dateRange]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[240px]" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    income: t.transactions.income,
    expense: t.transactions.expense,
    transfer: t.transactions.transfer,
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold" data-testid="text-transactions-title">{t.transactions.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.transactions.subtitle}</p>
        </div>
        <SetupFirstAccountModal
          open={setupOpen}
          onClose={() => setSetupOpen(false)}
          onSuccess={() => { setSetupOpen(false); setDialogOpen(true); }}
        />

        <Button
          data-testid="button-add-tx"
          onClick={() => {
            if (!accounts || accounts.length === 0) {
              setSetupOpen(true);
            } else {
              setDialogOpen(true);
            }
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> {t.transactions.addTx}
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContentBottomSheet>
            <DialogHeader className="px-6 max-md:px-6 md:px-0 pt-1 md:pt-0">
              <DialogTitle className="text-lg">{t.transactions.dialogTitle}</DialogTitle>
              <DialogDescription>{t.transactions.dialogDesc}</DialogDescription>
            </DialogHeader>
            <TransactionForm accounts={accounts ?? []} onClose={() => setDialogOpen(false)} />
          </DialogContentBottomSheet>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-end gap-3" data-testid="filter-date-range">
        <div className="flex rounded-md border border-border p-1 gap-1 bg-muted/40">
          {(["last7", "thisMonth", "custom"] as const).map((f) => {
            const label = f === "last7" ? t.transactions.last7Days
              : f === "thisMonth" ? t.transactions.thisMonth
              : t.transactions.customRange;
            return (
              <button
                key={f}
                type="button"
                className={cn(
                  "px-3 py-1.5 rounded-sm text-sm font-medium transition-all duration-150",
                  dateFilter === f
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => setDateFilter(f)}
                data-testid={`button-filter-${f}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {dateFilter === "custom" && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-[150px]"
              data-testid="input-custom-start"
            />
            <span className="text-sm text-muted-foreground">—</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-[150px]"
              data-testid="input-custom-end"
            />
          </div>
        )}
      </div>

      <Card data-testid="card-spending-chart">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-4">{t.transactions.spendingOverview}</h3>
          <SpendingChart transactions={chartData} t={t} />
        </CardContent>
      </Card>

      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ArrowLeftRight className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">{t.transactions.noTx}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t.transactions.noTxDesc}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => {
            const isSavingsDeposit = tx.category === "Savings" && tx.note?.startsWith("Deposit to");
            const cfg = typeConfig[tx.type as keyof typeof typeConfig];
            const Icon = isSavingsDeposit ? PiggyBank : cfg.icon;
            const iconColor = isSavingsDeposit ? "text-teal-600 dark:text-teal-400" : cfg.color;
            const iconBg = isSavingsDeposit ? "bg-teal-500/10" : cfg.bg;
            const goalName = isSavingsDeposit ? tx.note?.replace("Deposit to ", "") : null;
            return (
              <Card key={tx.id} className="hover-elevate transition-all duration-200" data-testid={`card-tx-${tx.id}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {isSavingsDeposit
                          ? goalName
                          : tx.type === "transfer"
                            ? `${getAccountName(tx.fromAccountId)} → ${getAccountName(tx.toAccountId)}`
                            : (tx.category ? ((t.categories as Record<string, string>)[tx.category] || tx.category) : typeLabels[tx.type] || cfg.label)}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {isSavingsDeposit ? (language === "en" ? "Goal" : "Nabung") : typeLabels[tx.type] || cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{tx.date}</span>
                      {!isSavingsDeposit && tx.note && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{tx.note}</span>}
                      {isSavingsDeposit && <span className="text-xs text-muted-foreground">{getAccountName(tx.fromAccountId)}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-mono font-semibold text-sm ${
                      tx.type === "income" ? "text-green-600 dark:text-green-400" :
                      tx.type === "expense" ? "text-red-500 dark:text-red-400" :
                      isSavingsDeposit ? "text-emerald-600 dark:text-emerald-400" :
                      "text-foreground"
                    }`}>
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}
                      {isSavingsDeposit ? formatCurrency(String(Math.abs(Number(tx.amount)))) : formatCurrency(tx.amount)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tx.type === "income" ? getAccountName(tx.toAccountId) :
                       tx.type === "expense" ? getAccountName(tx.fromAccountId) : ""}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteTxMutation.mutate(tx.id)}
                    disabled={deleteTxMutation.isPending}
                    data-testid={`button-delete-tx-${tx.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
