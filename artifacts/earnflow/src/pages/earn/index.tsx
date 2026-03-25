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
    avg: "50–600 pts",
    badge: "Best Value",
    badgeColor: "bg-green-500",
    href: "/surveys",
  },
  {
    icon: "🎯",
    title: "Offer Walls",
    description: "Download apps, sign up for services, watch videos.",
    avg: "10–500 pts",
    badge: "Most Offers",
    badgeColor: "bg-red-500",
    href: "/offer-walls",
  },
  {
    icon: "🎁",
    title: "Daily Bonus",
    description: "Log in daily to collect bonus points. Streak = bigger reward.",
    avg: "10–100 pts",
    badge: "Free",
    badgeColor: "bg-yellow-500",
    href: "/daily-bonus",
  },
  {
    icon: "👥",
    title: "Refer Friends",
    description: "Earn 250 pts for every friend you bring to the platform.",
    avg: "250 pts each",
    badge: "Passive",
    badgeColor: "bg-purple-500",
    href: "/referral",
  },
];

export default function EarnHub() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Earn Points</h1>
          <p className="text-muted-foreground">Your balance: <span className="text-green-400 font-bold">{user?.pointsBalance?.toLocaleString() ?? 0} pts</span> = <span className="text-green-400 font-bold">${((user?.pointsBalance ?? 0) / 100).toFixed(2)}</span></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((m) => (
            <Link key={m.href} href={m.href}>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-red-600 transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">{m.icon}</span>
                    <Badge className={`${m.badgeColor} text-white text-xs`}>{m.badge}</Badge>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">{m.title}</h2>
                  <p className="text-muted-foreground text-sm mb-3">{m.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Avg reward:</span>
                    <span className="text-green-400 font-bold text-sm">{m.avg}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-zinc-500 text-sm text-center">
            💡 <strong className="text-white">100 pts = $1.00</strong> — Minimum withdrawal is 500 pts ($5.00). Payments via PayPal, Crypto & Gift Cards.
          </p>
        </div>
      </div>
    </div>
  );
}
