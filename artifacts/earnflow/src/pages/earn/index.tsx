import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const methods = [
  {
    icon: "📊",
    title: "Surveys",
    description: "Answer questions from top brands. Highest payout per minute.",
    avg: "50–800 pts",
    badge: "Best Value",
    badgeColor: "bg-green-600",
    href: "/surveys",
  },
  {
    icon: "🎯",
    title: "Offer Walls",
    description: "Download apps, sign up for services, watch videos. Auto-credited.",
    avg: "10–600 pts",
    badge: "Most Offers",
    badgeColor: "bg-red-600",
    href: "/offer-walls",
  },
  {
    icon: "📦",
    title: "Loot Box",
    description: "Open a free mystery box every day. Up to 750 pts inside!",
    avg: "10–750 pts",
    badge: "Daily Free",
    badgeColor: "bg-orange-600",
    href: "/loot-box",
  },
  {
    icon: "🎡",
    title: "Spin Wheel",
    description: "Spin the prize wheel once a day for free bonus points.",
    avg: "5–200 pts",
    badge: "Daily Free",
    badgeColor: "bg-purple-600",
    href: "/spin-wheel",
  },
  {
    icon: "🎁",
    title: "Daily Bonus",
    description: "Log in every day to keep your streak. Day 7 = 100 pts jackpot.",
    avg: "10–100 pts",
    badge: "Streak",
    badgeColor: "bg-yellow-600",
    href: "/daily-bonus",
  },
  {
    icon: "👥",
    title: "Refer Friends",
    description: "Earn 250 pts for every friend you bring. Share your link now.",
    avg: "250 pts each",
    badge: "Passive",
    badgeColor: "bg-blue-600",
    href: "/referral",
  },
];

export default function EarnHub() {
  const { user } = useAuth();
  const balance = user?.pointsBalance ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">Ways to Earn</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-zinc-400">Balance:</span>
            <span className="text-green-400 font-black text-lg">{balance.toLocaleString()} pts</span>
            <span className="text-zinc-600">=</span>
            <span className="text-green-400 font-bold">${(balance / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {methods.map((m) => (
            <Link key={m.href} href={m.href}>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-red-600/70 transition-all cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{m.icon}</span>
                    <Badge className={`${m.badgeColor} text-white text-xs font-bold`}>{m.badge}</Badge>
                  </div>
                  <h2 className="text-lg font-black text-white mb-1 group-hover:text-red-400 transition-colors uppercase tracking-tight">
                    {m.title}
                  </h2>
                  <p className="text-zinc-500 text-sm mb-3">{m.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">Reward:</span>
                    <span className="text-green-400 font-bold text-sm">{m.avg}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
          <p className="text-zinc-500 text-sm">
            💡 <strong className="text-white">100 pts = $1.00</strong> — Minimum cashout is 500 pts ($5.00) via PayPal, Crypto, or Gift Card.
          </p>
        </div>
      </div>
    </div>
  );
}
