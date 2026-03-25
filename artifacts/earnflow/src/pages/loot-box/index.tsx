import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type LootStatus = {
  canPlay: boolean;
  lastWin: { pts: number; tier: string } | null;
  tiers: { label: string; emoji: string; pts: number }[];
  resetsAt: string;
};

type OpenResult = { pts: number; tier: string; label: string };

const TIER_COLORS: Record<string, string> = {
  Common:    "from-zinc-600 to-zinc-500",
  Uncommon:  "from-green-700 to-green-500",
  Rare:      "from-blue-700 to-blue-500",
  Epic:      "from-purple-700 to-purple-500",
  Legendary: "from-yellow-600 to-yellow-400",
  JACKPOT:   "from-cyan-500 to-pink-500",
};

export default function LootBox() {
  const qc = useQueryClient();
  const [result, setResult] = useState<OpenResult | null>(null);
  const [opening, setOpening] = useState(false);

  const { data: status } = useQuery<LootStatus>({
    queryKey: ["loot-box-status"],
    queryFn: () => fetch("/api/games/loot-box/status").then(r => r.json()),
  });

  const openMutation = useMutation({
    mutationFn: () =>
      fetch("/api/games/loot-box/open", { method: "POST" }).then(async r => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json() as Promise<OpenResult>;
      }),
    onMutate: () => setOpening(true),
    onSuccess: (data) => {
      setResult(data);
      setOpening(false);
      toast({ title: `${data.tier} — +${data.pts} pts!`, description: "Credited to your balance." });
      qc.invalidateQueries({ queryKey: ["loot-box-status"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: Error) => {
      setOpening(false);
      toast({ title: "Can't open", description: err.message, variant: "destructive" });
    },
  });

  const gradient = result ? (TIER_COLORS[result.label] ?? TIER_COLORS.Common) : "from-red-800 to-red-600";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <h1 className="text-4xl font-black text-white mb-1 uppercase tracking-tight">
          🎁 Loot Box
        </h1>
        <p className="text-zinc-400 mb-8">One free open per day. Up to 750 pts inside!</p>

        {/* Box */}
        <div className="flex justify-center mb-8">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="box"
                initial={{ scale: 1 }}
                animate={opening ? { scale: [1, 1.1, 0.95, 1.2, 0], rotate: [0, -5, 5, -3, 0], opacity: [1, 1, 1, 1, 0] } : { scale: 1 }}
                transition={{ duration: 0.8 }}
                className="cursor-pointer select-none"
                onClick={() => status?.canPlay && !opening && openMutation.mutate()}
              >
                <div className={`w-48 h-48 rounded-2xl bg-gradient-to-br from-red-700 to-red-900 border-4 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] flex flex-col items-center justify-center transition-transform hover:scale-105 ${!status?.canPlay ? "opacity-40 cursor-not-allowed" : ""}`}>
                  <span className="text-7xl">{opening ? "✨" : "📦"}</span>
                  {!opening && status?.canPlay && (
                    <span className="text-xs font-bold text-red-300 mt-2 uppercase tracking-widest">Click to Open</span>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ scale: 0, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`w-56 h-56 rounded-2xl bg-gradient-to-br ${gradient} border-4 border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.2)] flex flex-col items-center justify-center`}
              >
                <span className="text-6xl mb-2">{result.tier.split(" ")[0]}</span>
                <span className="text-white font-black text-xl">{result.tier.split(" ").slice(1).join(" ")}</span>
                <span className="text-4xl font-black text-white mt-2">+{result.pts} pts</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        {!result ? (
          <Button
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 text-lg font-bold disabled:opacity-40"
            disabled={!status?.canPlay || opening}
            onClick={() => openMutation.mutate()}
          >
            {opening ? "Opening..." : status?.canPlay ? "Open Free Box" : "✅ Come Back Tomorrow"}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-green-400 font-bold text-lg">+{result.pts} pts added to your balance!</p>
            <Button variant="outline" onClick={() => setResult(null)} className="border-zinc-700">
              See Box Again
            </Button>
          </div>
        )}

        {status?.lastWin && !result && (
          <p className="text-zinc-600 text-sm mt-4">
            Yesterday you won: <span className="text-zinc-400">{status.lastWin.tier} (+{status.lastWin.pts} pts)</span>
          </p>
        )}

        {/* Tier table */}
        <div className="mt-10 text-left">
          <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-3">Possible Prizes</h3>
          <div className="grid grid-cols-3 gap-2">
            {status?.tiers.map(t => (
              <div key={t.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
                <div className="text-2xl">{t.emoji}</div>
                <div className="text-xs font-bold text-zinc-300 mt-1">{t.label}</div>
                <div className="text-green-400 font-black text-sm">{t.pts} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
