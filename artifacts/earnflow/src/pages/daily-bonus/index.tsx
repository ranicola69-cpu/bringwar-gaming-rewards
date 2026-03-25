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
};

export default function DailyBonus() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: status, isLoading } = useQuery<DailyStatus>({
    queryKey: ["daily-reward-status"],
    queryFn: async () => {
      const res = await fetch("/api/daily-reward/status");
      return res.json();
    },
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/daily-reward/claim", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `🎁 +${data.points} points claimed!`, description: `Day ${data.streakDay} streak!` });
      qc.invalidateQueries({ queryKey: ["daily-reward-status"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: Error) => {
      toast({ title: "Already claimed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const streak = status?.currentStreak ?? 0;
  const schedule = status?.schedule ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🎁</div>
          <h1 className="text-3xl font-bold text-white">Daily Bonus</h1>
          <p className="text-muted-foreground mt-1">Log in every day to keep your streak and earn bigger rewards.</p>
        </div>

        {/* Streak display */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-zinc-400 text-sm">Current Streak</span>
            <span className="text-3xl font-bold text-red-400">🔥 Day {streak}</span>
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-2">
            {schedule.map((day) => {
              const isDone = !status?.canClaim && day.day <= streak;
              const isToday = status?.canClaim
                ? day.day === (streak === 0 ? 1 : streak)
                : day.day === streak;
              const isFuture = day.day > streak + (status?.canClaim ? 0 : 0);

              return (
                <div
                  key={day.day}
                  className={`flex flex-col items-center p-2 rounded-lg border text-center ${
                    isDone
                      ? "border-green-600 bg-green-900/30"
                      : isToday && status?.canClaim
                      ? "border-red-500 bg-red-500/20 ring-2 ring-red-500"
                      : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  <span className="text-xs text-zinc-500 mb-1">Day {day.day}</span>
                  <span className="text-lg">{isDone ? "✅" : day.day === 7 ? "💎" : "🎁"}</span>
                  <span className="text-xs font-bold text-green-400 mt-1">+{day.points}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim button */}
        <div className="text-center">
          {status?.canClaim ? (
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-xl font-bold"
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
            >
              {claimMutation.isPending ? "Claiming..." : `Claim +${status.nextPoints} pts 🎁`}
            </Button>
          ) : (
            <div>
              <Button size="lg" disabled className="px-12 py-6 text-xl">
                ✅ Claimed Today
              </Button>
              {status?.nextClaimAt && (
                <p className="text-zinc-500 text-sm mt-3">
                  Come back tomorrow for Day {(status.currentStreak < 7 ? status.currentStreak + 1 : 1)}{" "}
                  (+{status.nextPoints} pts)
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-zinc-600 text-xs">
          Day 7 = 💎 100 pts jackpot. Miss a day and your streak resets to Day 1.
        </div>
      </div>
    </div>
  );
}
