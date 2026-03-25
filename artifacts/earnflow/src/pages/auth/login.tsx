import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ data: { email, password } });
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    } catch (err: any) {
      toast({ 
        title: "Login failed", 
        description: err?.response?.data?.error || "Invalid credentials", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="p-8 bg-black/80 backdrop-blur-xl border border-white/10 rounded-none shadow-[0_0_30px_rgba(0,0,0,1)] relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            <div className="text-center mb-8 mt-2">
              <h1 className="text-4xl font-black font-display text-white mb-2 uppercase tracking-tighter">Welcome Back</h1>
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Authorize to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Email Address</label>
                <Input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="agent@example.com"
                  className="bg-zinc-950 border-white/10 focus:border-primary rounded-none h-12 text-white font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Password</label>
                <Input 
                  type="password" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-zinc-950 border-white/10 focus:border-primary rounded-none h-12 text-white font-medium"
                />
              </div>

              <Button type="submit" className="w-full h-14 mt-8 text-lg font-black uppercase tracking-widest rounded-none bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(230,57,70,0.3)]" isLoading={loading}>
                Access Protocol
              </Button>
            </form>

            <p className="text-center mt-8 text-zinc-500 text-sm font-medium uppercase tracking-wider">
              No clearance? <Link href="/register" className="text-white hover:text-primary transition-colors font-bold underline decoration-primary/50 underline-offset-4">Create account</Link>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
