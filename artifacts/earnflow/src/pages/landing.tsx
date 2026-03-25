import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Coins, ShieldCheck, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] opacity-10 bg-cover bg-center mix-blend-overlay" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-primary/20 mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(230,57,70,0.3)]">
              <SparklesIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-zinc-200 uppercase tracking-widest">The Ultimate Reward Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black font-display text-white mb-6 leading-tight uppercase tracking-tight">
              Turn your free time into <br/>
              <span className="text-success drop-shadow-[0_0_20px_rgba(0,200,83,0.5)]">Real Money</span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Complete high-paying offers, dominate leaderboards, and harvest your points. 
              Instant cashouts. Zero mercy for low rates.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto rounded-none font-bold uppercase tracking-wider text-lg h-14 px-8 group bg-primary hover:bg-primary/90 text-white border-2 border-primary shadow-[0_0_20px_rgba(230,57,70,0.4)]">
                  Start Earning Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-none font-bold uppercase tracking-wider text-lg h-14 px-8 backdrop-blur-md border-white/20 hover:bg-white/5 text-white">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-24"
          >
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-success" />}
              title="Instant Cashouts"
              desc="Get paid within minutes. Crypto, PayPal, Gift Cards."
            />
            <FeatureCard 
              icon={<Coins className="w-8 h-8 text-success" />}
              title="Maximum Payouts"
              desc="We slice the middlemen to give you raw, unadulterated earnings."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-success" />}
              title="Ironclad Security"
              desc="Your data and funds are secured with military-grade encryption."
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-panel border-white/5 border-t-primary/30 border-b-black/50 p-8 text-left hover:-translate-y-1 transition-transform duration-300">
      <div className="w-14 h-14 bg-black/50 flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_10px_rgba(0,200,83,0.1)]">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 font-display uppercase tracking-wide">{title}</h3>
      <p className="text-zinc-400 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
