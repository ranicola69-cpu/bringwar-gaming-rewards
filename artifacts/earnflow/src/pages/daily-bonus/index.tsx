import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type DailyStatus = {
  canClaim: boolean;
  currentStreak: number;
  nextPoints: number;
  nextClaimAt: string | null;
  schedule: { day: number; points: number }[];
  shieldActive: boolean;
  shieldCost: number;
};

export default function DailyBonus() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: status, isLoading } = useQuery<DailyStatus>({
    queryKey: ["daily-reward-status"],
    queryFn: () => fetch("/api/daily-reward/status").then(r => r.json()),
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/daily-reward/claim", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `🎁 +${data.points} pts!`, description: `Day ${data.streakDay} streak!` });
      qc.invalidateQueries({ queryKey: ["daily-reward-status"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: Error) => toast({ title: "Already claimed", description: err.message, variant: "destructive" }),
  });

  const shieldMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/daily-reward/shield", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "🛡️ Streak Shield active!", description: "Your streak is protected for the next 48 hours." });
      qc.invalidateQueries({ queryKey: ["daily-reward-status"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: Error) => toast({ title: "Can't buy shield", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    </div>
  );

  const streak  = status?.currentStreak ?? 0;
  const schedule = status?.schedule ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎁</div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Daily Bonus</h1>
          <p className="text-zinc-400 mt-1">Log in every day. Day 7 = 💎 100 pts jackpot.</p>
        </div>

        {/* Streak card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Current Streak</span>
            <div className="flex items-center gap-2">
              {status?.shieldActive && (
                <span className="text-xs bg-blue-900/60 border border-blue-700 text-blue-300 px-2 py-0.5 rounded-full font-bold">🛡️ Protected</span>
              )}
              <span className="text-3xl font-black text-red-400">🔥 Day {streak}</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {schedule.map((day) => {
              const done    = !status?.canClaim && day.day <= streak;
              const today   = status?.canClaim && day.day === (streak === 0 ? 1 : streak + 0) || (!status?.canClaim && day.day === streak);
              const claimable = status?.canClaim && day.day === streak + 1;

              return (
                <div key={day.day}
                  className={`flex flex-col items-center p-1.5 rounded-lg border text-center transition-all ${
                    done       ? "border-green-700 bg-green-900/30"
                    : claimable ? "border-red-500 bg-red-500/20 ring-2 ring-red-500 animate-pulse"
                    : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  <span className="text-xs text-zinc-500 mb-0.5">D{day.day}</span>
                  <span className="text-base">{done ? "✅" : day.day === 7 ? "💎" : "🎁"}</span>
                  <span className="text-xs font-bold text-green-400">+{day.points}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim */}
        <div className="text-center mb-6">
          {status?.canClaim ? (
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-xl font-black w-full"
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
            >
              {claimMutation.isPending ? "Claiming..." : `Claim +${status.nextPoints} pts 🎁`}
            </Button>
          ) : (
            <div>
              <Button size="lg" disabled className="px-12 py-6 text-xl w-full">✅ Claimed Today</Button>
              {status?.nextClaimAt && (
                <p className="text-zinc-500 text-sm mt-2">
                  Come back tomorrow for Day {status.currentStreak < 7 ? status.currentStreak + 1 : 1} (+{status.nextPoints} pts)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Streak Shield purchase */}
        <div className={`p-4 rounded-xl border transition-all ${
          status?.shieldActive
            ? "border-blue-700/50 bg-blue-950/30"
            : "border-zinc-800 bg-zinc-900"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🛡️</span>
                <span className="font-black text-white">Streak Shield</span>
                {status?.shieldActive && <span className="text-xs bg-blue-700 text-white px-2 py-0.5 rounded-full">Active</span>}
              </div>
              <p className="text-zinc-500 text-sm">
                {status?.shieldActive
                  ? "Your streak is protected. If you miss tomorrow, it won't reset."
                  : `Protect your streak for the next 48 hrs. Costs ${status?.shieldCost ?? 50} pts.`}
              </p>
            </div>
            {!status?.shieldActive && (
              <Button
                size="sm"
                className="shrink-0 bg-blue-700 hover:bg-blue-600 text-white font-bold ml-4"
                disabled={shieldMutation.isPending || (user?.pointsBalance ?? 0) < (status?.shieldCost ?? 50)}
                onClick={() => shieldMutation.mutate()}
              >
                Buy -{status?.shieldCost ?? 50} pts
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6">
          Day 7 = 💎 100 pt jackpot. Miss a day without a shield and your streak resets.
        </p>
      </div>
    </div>
  );
}
