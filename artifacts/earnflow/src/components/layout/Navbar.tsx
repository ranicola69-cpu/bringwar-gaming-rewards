import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Activity, Coins, LayoutDashboard, LogOut, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { formatPoints } from "@/lib/utils";

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [location] = useLocation();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: isAuthenticated },
    { href: "/offers", label: "Earn", icon: Sparkles, show: isAuthenticated },
    { href: "/my-completions", label: "Activity", icon: Activity, show: isAuthenticated },
    { href: "/withdrawals", label: "Cashout", icon: Wallet, show: isAuthenticated },
    { href: "/admin", label: "Admin Panel", icon: ShieldAlert, show: isAdmin },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-primary/20 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <span className="font-display text-3xl font-black tracking-tighter text-white uppercase italic">BRING<span className="text-primary">WAR</span><span className="text-success text-lg ml-2 font-bold tracking-widest">GAMING REWARDS</span></span>
          </Link>
          
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-2">
              {navLinks.filter(l => l.show).map(link => {
                const Icon = link.icon;
                const isActive = location.startsWith(link.href);
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                      isActive 
                        ? "bg-primary/10 text-primary border-b-2 border-primary" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border-b-2 border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2 border border-success/30 bg-success/10 px-4 py-1.5 shadow-[0_0_10px_rgba(0,200,83,0.15)]">
                <Coins className="h-4 w-4 text-success" />
                <span className="font-bold text-success font-display">{formatPoints(user?.pointsBalance || 0)}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="text-zinc-500 hover:text-primary hover:bg-primary/10">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold uppercase tracking-wide text-zinc-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/register">
                <Button className="font-bold uppercase tracking-wide rounded-none border-2 border-primary bg-primary hover:bg-primary/80 shadow-[0_0_15px_rgba(230,57,70,0.3)] text-white">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
