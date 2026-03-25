import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Coins, ShieldCheck, Zap, Users, DollarSign, Trophy, Star } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L13.5 8.5H19L14.5 12L16 17.5L12 14L8 17.5L9.5 12L5 8.5H10.5L12 3Z" />
    </svg>
  );
}

const FEATURES = [
  { icon: Zap,        label: "9 Live Ad Networks",   sub: "OfferToro, CPX, Lootably & more" },
  { icon: Coins,      label: "100 pts = $1.00",       sub: "Transparent, real cash value" },
  { icon: ShieldCheck, label: "Streak Shields",       sub: "Protect your daily bonus streak" },
  { icon: Trophy,     label: "Daily Spin & Loot Box", sub: "Bonus prizes every 24 hrs" },
];

const SOCIALS = [
  { pts: 850, user: "G***r",   method: "PayPal",  ago: "2 min ago"  },
  { pts: 2000, user: "M***a",  method: "CashApp", ago: "11 min ago" },
  { pts: 1500, user: "D***s",  method: "PayPal",  ago: "34 min ago" },
  { pts: 3200, user: "K***i",  method: "Crypto",  ago: "1 hr ago"   },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-primary/30 mb-8">
              <SparklesIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-zinc-200 uppercase tracking-widest">BRINGWAR Gaming Rewards</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-5 leading-tight uppercase tracking-tight">
              Play. Earn.<br />
              <span className="text-primary drop-shadow-[0_0_20px_rgba(230,57,70,0.6)]">Get Paid.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 mb-3 max-w-2xl mx-auto">
              Complete offers, surveys, and games from 9 top ad networks. Every 100 points = $1 cash — straight to your PayPal, CashApp, or crypto wallet.
            </p>
            <p className="text-sm text-green-400 font-bold mb-10">
              ✅ +50 FREE points just for signing up
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto font-black uppercase tracking-wider text-lg h-14 px-10 bg-primary hover:bg-primary/90 text-white shadow-[0_0_24px_rgba(230,57,70,0.4)]">
                  Claim My Free 50 pts
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold uppercase tracking-wider text-lg h-14 px-8 border-white/20 text-white hover:bg-white/5">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Live stats bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 mb-16 text-center">
              {[
                { icon: Users,       label: "Active Members", val: "12,400+" },
                { icon: DollarSign,  label: "Total Paid Out", val: "$48,200+" },
                { icon: Star,        label: "Avg. Rating",    val: "4.8 / 5" },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs uppercase tracking-wider mb-0.5">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <div className="text-2xl font-black text-white">{val}</div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-16">
              {FEATURES.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center hover:border-zinc-600 transition-colors">
                  <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="font-black text-white text-sm mb-0.5">{label}</div>
                  <div className="text-xs text-zinc-500">{sub}</div>
                </div>
              ))}
            </div>

            {/* Social proof — live withdrawal feed */}
            <div className="max-w-sm mx-auto mb-12">
              <h3 className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Recent Cashouts</h3>
              <div className="space-y-2">
                {SOCIALS.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5"
                  >
                    <div className="text-sm text-zinc-300">
                      <span className="font-bold text-white">{s.user}</span> cashed out{" "}
                      <span className="text-green-400 font-bold">{s.pts} pts</span> via {s.method}
                    </div>
                    <div className="text-xs text-zinc-600 ml-3 shrink-0">{s.ago}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Final CTA */}
            <Link href="/register">
              <Button size="lg" className="font-black uppercase tracking-wider text-lg h-14 px-12 bg-green-700 hover:bg-green-600 text-white">
                Start Earning Free — Join Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </main>

        <footer className="py-6 text-center text-zinc-700 text-xs border-t border-zinc-900">
          © {new Date().getFullYear()} BRINGWAR Gaming Rewards by DPHMS. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
