import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListWithdrawals, useRequestWithdrawal, getListWithdrawalsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPoints } from "@/lib/utils";
import { format } from "date-fns";
import { Wallet, ArrowRightLeft, Info } from "lucide-react";

type WithdrawConfig = { minWithdrawal: number; processingFee: number; pointsToCash: number };

const METHOD_LABELS: Record<string, string> = {
  paypal: "💳 PayPal",
  crypto: "₿ Crypto",
  giftcard: "🎁 Gift Card",
  cashapp: "💚 Cash App",
  venmo: "🔵 Venmo",
};

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-600",
  approved: "bg-blue-600",
  paid:     "bg-green-600",
  rejected: "bg-red-600",
};

export default function Withdrawals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: withdrawals, isLoading } = useListWithdrawals();
  const requestMutation = useRequestWithdrawal();

  const { data: config } = useQuery<WithdrawConfig>({
    queryKey: ["withdraw-config"],
    queryFn: () => fetch("/api/withdrawals/config").then(r => r.json()),
  });

  const MIN  = config?.minWithdrawal  ?? 1500;
  const FEE  = config?.processingFee  ?? 100;
  const RATE = config?.pointsToCash   ?? 0.01;

  const [points, setPoints] = useState<number | "">("");
  const [method, setMethod] = useState("paypal");
  const [details, setDetails] = useState("");

  const cashValue   = typeof points === "number" ? points * RATE : 0;
  const totalNeeded = typeof points === "number" ? points + FEE : 0;
  const canAfford   = totalNeeded <= (user?.pointsBalance ?? 0);
  const meetsMin    = typeof points === "number" && points >= MIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsMin) {
      toast({ title: "Too low", description: `Minimum withdrawal is ${MIN.toLocaleString()} pts`, variant: "destructive" });
      return;
    }
    if (!canAfford) {
      toast({ title: "Not enough pts", description: `You need ${totalNeeded.toLocaleString()} pts (including ${FEE} fee)`, variant: "destructive" });
      return;
    }
    try {
      await requestMutation.mutateAsync({ data: { points: points as number, method: method as any, paymentDetails: details } });
      toast({ title: "✅ Withdrawal submitted!", description: `$${cashValue.toFixed(2)} is on its way.` });
      setPoints(""); setDetails("");
      queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error || "Failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-black text-white mb-8 uppercase tracking-tight flex items-center gap-3">
          <Wallet className="h-7 w-7 text-primary" /> Cash Out
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1 space-y-4">
            {/* Balance */}
            <Card className="p-5 border-green-800/40 bg-green-950/20">
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Your Balance</div>
              <div className="text-3xl font-black text-green-400">{(user?.pointsBalance ?? 0).toLocaleString()} pts</div>
              <div className="text-sm text-zinc-400">${((user?.pointsBalance ?? 0) * RATE).toFixed(2)} available</div>
            </Card>

            {/* Fee notice */}
            <div className="flex gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400">
              <Info className="h-4 w-4 shrink-0 text-yellow-500 mt-0.5" />
              <div>
                <strong className="text-white">Withdrawal fee:</strong> {FEE} pts ($1.00) per request.
                Minimum: {MIN.toLocaleString()} pts + {FEE} fee = {(MIN + FEE).toLocaleString()} pts total.
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Card className="p-5 border-white/10 bg-card/50 space-y-4">
                <div>
                  <label className="text-sm font-bold text-zinc-300 mb-2 block">Points to Cash Out</label>
                  <Input
                    type="number"
                    min={MIN}
                    max={user?.pointsBalance ?? 0}
                    value={points}
                    onChange={e => setPoints(e.target.value ? parseInt(e.target.value) : "")}
                    placeholder={`Min ${MIN.toLocaleString()}`}
                    className="bg-black/40 border-white/10 text-white text-lg font-bold"
                    required
                  />
                  {typeof points === "number" && points > 0 && (
                    <div className={`text-xs mt-1.5 ${canAfford && meetsMin ? "text-green-400" : "text-red-400"}`}>
                      = ${cashValue.toFixed(2)} cash · {FEE} pt fee · need {totalNeeded.toLocaleString()} total
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-bold text-zinc-300 mb-2 block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(METHOD_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setMethod(key)}
                        className={`py-2 px-3 text-sm font-bold rounded-lg border transition-all text-left ${
                          method === key
                            ? "border-primary bg-primary/10 text-white"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-zinc-300 mb-2 block">Payment Details</label>
                  <Input
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder={
                      method === "paypal"  ? "your@paypal.com" :
                      method === "crypto"  ? "Wallet address (BTC/ETH/USDT)" :
                      method === "cashapp" ? "$cashtag" :
                      method === "venmo"   ? "@venmo-username" :
                      "Gift card preference"
                    }
                    className="bg-black/40 border-white/10"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full font-black text-sm uppercase tracking-wide"
                  isLoading={requestMutation.isPending}
                  disabled={!meetsMin || !canAfford || !details.trim()}
                >
                  Request ${cashValue.toFixed(2)} Payout
                </Button>
              </Card>
            </form>
          </div>

          {/* History */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" /> History
            </h2>
            {isLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-900 rounded-lg animate-pulse" />
              ))}</div>
            ) : !withdrawals?.length ? (
              <Card className="p-8 border-white/10 bg-card/30 text-center">
                <p className="text-zinc-500">No withdrawals yet.</p>
                <p className="text-zinc-600 text-sm mt-1">Start earning to cash out!</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {withdrawals.map((w: any) => (
                  <Card key={w.id} className="p-4 border-white/10 bg-card/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-white">{formatPoints(w.points)} pts</span>
                          <span className="text-zinc-500 text-sm">→</span>
                          <span className="text-green-400 font-bold">{formatCurrency(w.cashAmount)}</span>
                          <Badge className={`${STATUS_COLORS[w.status] ?? "bg-zinc-700"} text-white text-xs capitalize`}>
                            {w.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-zinc-500">
                          {METHOD_LABELS[w.method] ?? w.method} · {w.paymentDetails} · {w.createdAt ? format(new Date(w.createdAt), "MMM d, yyyy") : ""}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
