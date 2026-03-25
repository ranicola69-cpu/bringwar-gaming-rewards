import { useListOffers } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPoints } from "@/lib/utils";
import { Clock, Loader2, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function OffersWall() {
  const { data: offers, isLoading } = useListOffers();

  const activeOffers = offers?.filter(o => o.isActive) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="bg-black border-b border-primary/20 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="mb-4 bg-primary/10 text-primary border border-primary/30 uppercase tracking-widest font-bold shadow-[0_0_10px_rgba(230,57,70,0.2)]">Live Offers</Badge>
          <h1 className="text-4xl md:text-6xl font-black font-display text-white mb-4 uppercase tracking-tighter">Extract <span className="text-primary drop-shadow-[0_0_10px_rgba(230,57,70,0.5)]">Value</span></h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg font-medium">Complete these tasks to harvest points instantly. Higher difficulty equals heavier payouts.</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : activeOffers.length === 0 ? (
          <div className="text-center py-20">
            <Star className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No offers available</h3>
            <p className="text-zinc-500">Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeOffers.map((offer, i) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <OfferCard offer={offer} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function OfferCard({ offer }: { offer: any }) {
  const difficultyColor = {
    easy: "bg-success/10 text-success border-success/30 shadow-[0_0_5px_rgba(0,200,83,0.2)]",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    hard: "bg-primary/10 text-primary border-primary/30 shadow-[0_0_5px_rgba(230,57,70,0.2)]",
  }[offer.difficulty as string] || "bg-zinc-500/10 text-zinc-400";

  return (
    <Card className="flex flex-col h-full bg-black/60 border-white/5 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(230,57,70,0.15)] transition-all duration-300 group rounded-none">
      {/* Image Area - fallback to abstract pattern if no image */}
      <div className="h-40 w-full bg-zinc-950 border-b border-white/5 relative overflow-hidden">
        {offer.imageUrl ? (
          <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-110 transition-all duration-500 mix-blend-luminosity" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
        <div className="absolute top-3 left-3">
          <Badge className="bg-black/80 backdrop-blur-md text-white border-white/10 uppercase tracking-widest text-[10px] font-bold">
            {offer.category}
          </Badge>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col relative">
        <div className="absolute top-0 right-6 -translate-y-1/2 bg-black border border-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-400 shadow-xl">
          {offer.estimatedTime}
        </div>
        
        <div className="flex justify-between items-start mb-3 gap-4 mt-2">
          <h3 className="text-xl font-black text-white font-display line-clamp-2 leading-tight uppercase tracking-wide">{offer.title}</h3>
        </div>
        
        <p className="text-sm text-zinc-400 line-clamp-2 mb-6 flex-1 font-medium">{offer.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <div className={`text-[10px] px-2.5 py-1 border ${difficultyColor} flex items-center gap-1.5 font-bold uppercase tracking-widest`}>
            <Zap className="h-3 w-3" /> {offer.difficulty}
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
          <div>
            <div className="text-2xl font-black text-success flex items-center gap-1.5 font-display drop-shadow-[0_0_5px_rgba(0,200,83,0.3)]">
              {formatPoints(offer.points)}
            </div>
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{formatCurrency(offer.cashValue)}</div>
          </div>
          <Link href={`/offers/${offer.id}`}>
            <Button size="sm" className="rounded-none px-6 font-bold uppercase tracking-wider bg-white/5 hover:bg-primary hover:text-white text-zinc-300 border border-white/10 hover:border-primary transition-all">Engage</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
