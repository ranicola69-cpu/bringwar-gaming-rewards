import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Activity, Coins, Gift, LayoutDashboard, LogOut, ShieldAlert, Users, Wallet, Zap } from "lucide-react";
import { formatPoints } from "@/lib/utils";
import { useState } from "react";

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: isAuthenticated },
    { href: "/earn", label: "Earn", icon: Zap, show: isAuthenticated },
    { href: "/surveys", label: "Surveys", icon: Activity, show: isAuthenticated },
    { href: "/offer-walls", label: "Offers", icon: Coins, show: isAuthenticated },
    { href: "/daily-bonus", label: "Daily", icon: Gift, show: isAuthenticated },
    { href: "/referral", label: "Refer", icon: Users, show: isAuthenticated },
    { href: "/withdrawals", label: "Cashout", icon: Wallet, show: isAuthenticated },
    { href: "/admin", label: "Admin", icon: ShieldAlert, show: isAdmin },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-primary/20 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 shrink-0">
            <span className="font-display text-xl font-black tracking-tighter text-white uppercase italic">
              BRING<span className="text-primary">WAR</span>
              <span className="text-success text-xs ml-1 font-bold tracking-widest hidden sm:inline">REWARDS</span>
            </span>
          </Link>

          {/* Desktop nav */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-0">
              {navLinks.filter(l => l.show).map(link => {
                const Icon = link.icon;
                const isActive = location === link.href || location.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary border-b-2 border-primary"
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border-b-2 border-transparent"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-1.5 border border-success/30 bg-success/10 px-3 py-1 shadow-[0_0_10px_rgba(0,200,83,0.15)]">
                <Coins className="h-3.5 w-3.5 text-success" />
                <span className="font-bold text-success text-sm font-display">{formatPoints(user?.pointsBalance || 0)}</span>
              </div>

              {/* Mobile hamburger */}
              <button
                className="lg:hidden text-zinc-400 hover:text-white p-1"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <Button variant="ghost" size="icon" onClick={logout} className="text-zinc-500 hover:text-primary hover:bg-primary/10 h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold uppercase tracking-wide text-zinc-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/register">
                <Button className="font-bold uppercase tracking-wide text-sm rounded-none border-2 border-primary bg-primary hover:bg-primary/80 shadow-[0_0_15px_rgba(230,57,70,0.3)] text-white h-8 px-4">
                  Join Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && isAuthenticated && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-950">
          <div className="grid grid-cols-4 gap-0">
            {navLinks.filter(l => l.show).map(link => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex flex-col items-center gap-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive ? "text-primary bg-primary/10" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
