import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatPoints } from "@/lib/utils";
import { Coins, Target, TrendingUp, Wallet } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0 pointer-events-none" />
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black font-display text-white uppercase tracking-tight">Welcome back, <span className="text-primary">{user.username}</span></h1>
          <p className="text-zinc-400 mt-2 font-medium uppercase tracking-wider text-sm">Dashboard / Overview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Current Balance" 
            value={formatPoints(user.pointsBalance)} 
            subtitle={`≈ ${formatCurrency(user.pointsBalance / 100)}`}
            icon={<Wallet className="h-6 w-6 text-success" />} 
            valColor="text-success"
          />
          <StatCard 
            title="Total Earned" 
            value={formatPoints(user.totalEarned)} 
            subtitle={`Lifetime earnings`}
            icon={<TrendingUp className="h-6 w-6 text-success" />} 
            valColor="text-success"
          />
          <StatCard 
            title="Offers Completed" 
            value="View History" 
            subtitle="Check your activity"
            icon={<Target className="h-6 w-6 text-primary" />} 
            link="/my-completions"
          />
          <StatCard 
            title="Referral Code" 
            value={user.referralCode || "N/A"} 
            subtitle="Share & earn 10%"
            icon={<Coins className="h-6 w-6 text-zinc-300" />} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8 border-t-primary/40 border-x-white/5 border-b-black/50 bg-black/60 backdrop-blur-xl shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">Ready to earn more?</h2>
            <p className="text-zinc-400 mb-6 font-medium">New high-paying offers are bleeding points. Don't miss out on earning up to $50 today.</p>
            <Link href="/offers">
              <Button size="lg" className="w-full sm:w-auto rounded-none font-bold uppercase tracking-wider bg-success hover:bg-success/90 text-black border-2 border-success shadow-[0_0_15px_rgba(0,200,83,0.3)]">Browse Offers</Button>
            </Link>
          </Card>
          
          <Card className="p-8 border-t-white/10 border-x-white/5 border-b-black/50 bg-black/60 backdrop-blur-xl shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">Cash Out</h2>
            <p className="text-zinc-400 mb-6 font-medium">Convert your points to real cash. Minimum withdrawal is 500 points ($5.00).</p>
            <Link href="/withdrawals">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-none font-bold uppercase tracking-wider border-white/20 hover:bg-white/10 text-white">Request Withdrawal</Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, link, valColor = "text-white" }: { title: string, value: string, subtitle: string, icon: React.ReactNode, link?: string, valColor?: string }) {
  const content = (
    <Card className="p-6 border-t-white/10 border-x-white/5 border-b-black/50 bg-black/40 hover:bg-black/60 transition-colors h-full shadow-lg relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</p>
        <div className="p-2.5 bg-white/5 border border-white/10 shadow-inner">
          {icon}
        </div>
      </div>
      <h3 className={`text-3xl font-black mb-1 font-display tracking-tight relative z-10 ${valColor}`}>{value}</h3>
      <p className="text-sm font-medium text-zinc-500 relative z-10">{subtitle}</p>
    </Card>
  );

  if (link) {
    return <Link href={link} className="block h-full">{content}</Link>;
  }
  return content;
}
