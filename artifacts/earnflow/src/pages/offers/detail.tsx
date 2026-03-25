import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetOffer, useCompleteOffer } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPoints } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Clock, ShieldAlert, Zap } from "lucide-react";
import { Link } from "wouter";

export default function OfferDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { data: offer, isLoading } = useGetOffer(id);
  const completeMutation = useCompleteOffer();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [proof, setProof] = useState("");
  const [notes, setNotes] = useState("");

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!offer) return <div className="p-8 text-center text-white">Offer not found</div>;

  const handleSubmitProof = async () => {
    try {
      await completeMutation.mutateAsync({ id, data: { proof, notes } });
      toast({ title: "Success!", description: "Offer completion submitted for review." });
      setDialogOpen(false);
      setLocation("/my-completions");
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.error || "Failed to submit", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* Header Banner */}
      <div className="w-full h-64 bg-zinc-900 border-b border-white/5 relative">
        {offer.imageUrl ? (
          <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover opacity-40" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <Link href="/offers" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Offers
        </Link>

        <div className="bg-card border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-8">
            <div>
              <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 uppercase">{offer.category}</Badge>
              <h1 className="text-3xl sm:text-4xl font-bold font-display text-white mb-2">{offer.title}</h1>
              <p className="text-zinc-400 text-lg">{offer.description}</p>
            </div>
            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 min-w-[200px] text-center shrink-0">
              <p className="text-sm text-zinc-500 mb-1 font-medium uppercase tracking-wider">Reward</p>
              <div className="text-4xl font-bold text-primary mb-1">{formatPoints(offer.points)}</div>
              <div className="text-zinc-400 font-medium">{formatCurrency(offer.cashValue)}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-10 pb-10 border-b border-white/10">
            <div className="flex items-center gap-2 text-zinc-300 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="font-medium capitalize">Difficulty: {offer.difficulty}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Takes ~{offer.estimatedTime}</span>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-primary" /> Instructions
              </h3>
              <div className="prose prose-invert max-w-none text-zinc-300">
                {offer.instructions.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
              <ShieldAlert className="w-12 h-12 text-primary shrink-0" />
              <div className="flex-1 text-sm text-primary/80">
                <strong className="text-primary block mb-1">Review Process</strong>
                Ensure you follow all instructions exactly. Submit clear proof (e.g. screenshot link). Fake completions will result in an account ban.
              </div>
              <Button size="lg" className="w-full sm:w-auto shrink-0" onClick={() => setDialogOpen(true)}>
                Complete Offer
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader onClose={() => setDialogOpen(false)}>
          <DialogTitle>Submit Completion Proof</DialogTitle>
          <DialogDescription>
            Provide proof that you completed "{offer.title}". This will be reviewed by an admin.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Proof (Link to screenshot, username, etc.)</label>
            <Textarea 
              value={proof} 
              onChange={e => setProof(e.target.value)} 
              placeholder="https://imgur.com/... or My Username: john123"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Additional Notes <span className="text-zinc-500">(Optional)</span></label>
            <Textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Any other details..."
              className="min-h-[80px]"
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleSubmitProof} 
            isLoading={completeMutation.isPending}
            disabled={!proof.trim()}
          >
            Submit for Review
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
