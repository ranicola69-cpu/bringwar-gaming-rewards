import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const search = useSearch();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    referralCode: ""
  });
  const [loading, setLoading] = useState(false);

  // Auto-fill referral code from ?ref= query parameter
  useEffect(() => {
    const params = new URLSearchParams(search);
    const ref = params.get("ref");
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref.toUpperCase() }));
    }
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await register({ data: formData });
      toast({
        title: "🎉 Welcome to BRINGWAR!",
        description: formData.referralCode
          ? `+50 pts welcome bonus + referral applied! Start earning now.`
          : `+50 pts welcome bonus added to your account!`,
      });
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err?.response?.data?.error || err?.message || "Could not create account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="p-8 glass-panel border-white/10">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold font-display text-white mb-2">Create Account</h1>
              <p className="text-zinc-400">Start earning rewards today</p>
              <div className="mt-3 inline-flex items-center gap-2 bg-green-900/40 border border-green-700/50 rounded-full px-4 py-1.5">
                <span className="text-green-400 text-sm font-bold">🎁 +50 pts FREE welcome bonus</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Username</label>
                <Input
                  required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="cooluser99"
                  className="bg-black/40 border-white/10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Email Address</label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="bg-black/40 border-white/10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Password</label>
                <Input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-black/40 border-white/10"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                  Referral Code
                  {formData.referralCode && (
                    <span className="ml-2 text-green-400 text-xs">✓ Applied — your friend earns 250 pts!</span>
                  )}
                  {!formData.referralCode && (
                    <span className="text-zinc-500 ml-1">(Optional)</span>
                  )}
                </label>
                <Input
                  value={formData.referralCode}
                  onChange={e => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                  placeholder="FRIEND2024"
                  className={`bg-black/40 border-white/10 font-mono ${formData.referralCode ? "border-green-600 text-green-400" : ""}`}
                />
              </div>

              <Button type="submit" className="w-full h-12 mt-6 text-lg" isLoading={loading}>
                Sign Up — Start Earning Free
              </Button>
            </form>

            <p className="text-center mt-6 text-zinc-400 text-sm">
              Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
