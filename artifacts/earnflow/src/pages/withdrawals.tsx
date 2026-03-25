import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListWithdrawals, useRequestWithdrawal, getListWithdrawalsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPoints } from "@/lib/utils";
import { format } from "date-fns";
import { Wallet, ArrowRightLeft } from "lucide-react";

export default function Withdrawals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: withdrawals, isLoading } = useListWithdrawals();
  const requestMutation = useRequestWithdrawal();

  const [points, setPoints] = useState<number | "">("");
  const [method, setMethod] = useState("paypal");
  const [details, setDetails] = useState("");

  const cashValue = typeof points === 'number' ? points / 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!points || points < 500) {
      toast({ title: "Invalid amount", description: "Minimum withdrawal is 500 points ($5.00)", variant: "destructive" });
      return;
    }
    if (points > (user?.pointsBalance || 0)) {
      toast({ title: "Insufficient funds", description: "You don't have enough points.", variant: "destructive" });
      return;
    }

    try {
      await requestMutation.mutateAsync({ data: { points, method: method as any, paymentDetails: details } });
      toast({ title: "Success", description: "Withdrawal requested successfully!" });
      setPoints("");
      setDetails("");
      queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.error || "Failed to request withdrawal", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 border-white/10 bg-card/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-display">Cash Out</h2>
                  <p className="text-sm text-zinc-400">Available: {formatPoints(user?.pointsBalance || 0)} pts</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Points to Withdraw</label>
                  <Input 
                    type="number" 
                    min="500" 
                    step="100"
                    required 
                    value={points}
                    onChange={e => setPoints(e.target.value ? parseInt(e.target.value) : "")}
                    placeholder="Min. 500"
                  />
                  {cashValue > 0 && (
                    <div className="mt-2 text-sm text-emerald-400 font-medium flex items-center gap-1">
                      <ArrowRightLeft className="w-3 h-3" /> You will get {formatCurrency(cashValue)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Payment Method</label>
                  <select 
                    className="flex h-12 w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-white"
                    value={method}
                    onChange={e => setMethod(e.target.value)}
                  >
                    <option value="paypal">PayPal</option>
                    <option value="venmo">Venmo</option>
                    <option value="cashapp">CashApp</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="gift_card">Gift Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Account Details / Email</label>
                  <Input 
                    required 
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Enter your payment info"
                  />
                </div>

                <Button type="submit" className="w-full mt-2" isLoading={requestMutation.isPending}>
                  Request {cashValue > 0 ? formatCurrency(cashValue) : ""}
                </Button>
              </form>
            </Card>
          </div>

          {/* History Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold font-display text-white mb-6">Withdrawal History</h2>
            <Card className="border-white/10 bg-card/50 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-center text-zinc-500">Loading...</div>
              ) : !withdrawals || withdrawals.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">No withdrawals yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-400 uppercase bg-black/40 border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Method</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4 text-zinc-300">{format(new Date(w.createdAt), "MMM d, yyyy")}</td>
                          <td className="px-6 py-4 text-white capitalize">{w.method.replace('_', ' ')}</td>
                          <td className="px-6 py-4 font-bold text-primary">{formatCurrency(w.cashAmount)}</td>
                          <td className="px-6 py-4">
                            <Badge variant={w.status === 'paid' || w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'destructive' : 'warning'}>
                              {w.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
