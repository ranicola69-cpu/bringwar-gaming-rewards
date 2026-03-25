import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type ReferralStats = {
  referralCode: string;
  referralUrl: string;
  totalReferrals: number;
  referrals: { id: number; username: string; createdAt: string }[];
  bonusPerReferral: number;
};

export default function Referral() {
  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["referral-stats"],
    queryFn: async () => {
      const res = await fetch("/api/referral/stats");
      return res.json();
    },
  });

  const copyLink = () => {
    if (stats?.referralUrl) {
      navigator.clipboard.writeText(stats.referralUrl);
      toast({ title: "Link copied!", description: "Share it to earn 250 pts per signup." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">👥</div>
          <h1 className="text-3xl font-bold text-white">Refer & Earn</h1>
          <p className="text-muted-foreground mt-1">Earn <span className="text-green-400 font-bold">250 points ($2.50)</span> for every friend you refer.</p>
        </div>

        {/* Referral link box */}
        <Card className="bg-zinc-900 border-zinc-700 mb-6">
          <CardContent className="p-6">
            <p className="text-zinc-400 text-sm mb-2">Your referral link:</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono truncate">
                {stats?.referralUrl ?? "Loading..."}
              </div>
              <Button onClick={copyLink} className="bg-red-600 hover:bg-red-700 shrink-0">
                Copy
              </Button>
            </div>
            <p className="text-zinc-600 text-xs mt-2">Your code: <strong className="text-white">{stats?.referralCode}</strong></p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-zinc-900 border-zinc-800 text-center">
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-white">{stats?.totalReferrals ?? 0}</div>
              <div className="text-zinc-500 text-sm">Friends Referred</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 text-center">
            <CardContent className="p-4">
              <div className="text-3xl font-bold text-green-400">
                {((stats?.totalReferrals ?? 0) * (stats?.bonusPerReferral ?? 250)).toLocaleString()} pts
              </div>
              <div className="text-zinc-500 text-sm">Total Earned from Refs</div>
            </CardContent>
          </Card>
        </div>

        {/* Share buttons */}
        <div className="flex gap-3 mb-8">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Join BRINGWAR Gaming Rewards and earn real cash! " + (stats?.referralUrl ?? ""))}`, "_blank")}
          >
            WhatsApp
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(stats?.referralUrl ?? "")}&text=${encodeURIComponent("Join BRINGWAR and earn real cash!")}`, "_blank")}
          >
            Telegram
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Earn real cash on BRINGWAR Gaming Rewards! " + (stats?.referralUrl ?? ""))}`, "_blank")}
          >
            Twitter/X
          </Button>
        </div>

        {/* Referred users list */}
        {stats?.referrals && stats.referrals.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <h3 className="font-bold text-white mb-3">Your Referrals</h3>
              <div className="space-y-2">
                {stats.referrals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <span className="text-zinc-300 text-sm">@{r.username}</span>
                    <span className="text-green-400 text-sm font-bold">+250 pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
