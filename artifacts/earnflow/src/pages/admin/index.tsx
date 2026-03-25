import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPoints } from "@/lib/utils";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetStats,
  useListOffers,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
  useListCompletions,
  useApproveCompletion,
  useRejectCompletion,
  useListWithdrawals,
  useApproveWithdrawal,
  useRejectWithdrawal,
  useListUsers,
  getListOffersQueryKey,
  getListCompletionsQueryKey,
  getListWithdrawalsQueryKey
} from "@workspace/api-client-react";

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("stats");

  if (!isAdmin) {
    return <div className="p-8 text-center text-white">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-black text-white font-display mb-8 uppercase tracking-tighter border-l-4 border-primary pl-4">Command Center</h1>

        <div className="flex overflow-x-auto gap-2 mb-10 pb-2 scrollbar-hide">
          {['stats', 'offers', 'completions', 'withdrawals', 'users'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-none text-sm font-bold uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? "bg-primary text-white border border-primary shadow-[0_0_15px_rgba(230,57,70,0.3)]" 
                  : "bg-black text-zinc-500 border border-white/10 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
          <Link href="/admin/setup">
            <button className="px-6 py-3 rounded-none text-sm font-bold uppercase tracking-widest bg-green-900 text-green-300 border border-green-700 hover:bg-green-800 transition-all">
              🔧 Publisher Setup
            </button>
          </Link>
        </div>

        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'offers' && <OffersView />}
        {activeTab === 'completions' && <CompletionsView />}
        {activeTab === 'withdrawals' && <WithdrawalsView />}
        {activeTab === 'users' && <UsersView />}
      </div>
    </div>
  );
}

// -- Subviews --

function StatsView() {
  const { data: stats, isLoading } = useGetStats();
  if (isLoading || !stats) return <div className="text-white">Loading...</div>;

  const grossRev = Number((stats as any).grossRevenueUsd ?? 0);
  const netProfit = Number((stats as any).netProfitUsd ?? 0);
  const feeRev = Number((stats as any).feeRevenueUsd ?? 0);
  const margin = (stats as any).profitMarginPct ?? "0.0";

  return (
    <div className="space-y-6">
      {/* Profit banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-green-950 to-emerald-950 border border-green-700/40 rounded-xl p-5">
          <div className="text-xs text-green-400 uppercase tracking-widest font-bold mb-1">💰 Net Profit</div>
          <div className="text-4xl font-black text-green-300">${netProfit.toFixed(2)}</div>
          <div className="text-xs text-green-600 mt-1">After all payouts</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-1">📥 Gross Revenue</div>
          <div className="text-2xl font-black text-white">${grossRev.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 mt-1">From ad networks</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-1">📊 Margin</div>
          <div className="text-2xl font-black text-yellow-300">{margin}%</div>
          <div className="text-xs text-zinc-500 mt-1">Fee rev: ${feeRev.toFixed(2)}</div>
        </div>
      </div>

      {/* Regular stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Active Offers" value={stats.totalOffers} />
        <StatCard title="Pending Completions" value={stats.pendingCompletions} highlight />
        <StatCard title="Pending Withdrawals" value={stats.pendingWithdrawals} highlight />
        <StatCard title="Postbacks Received" value={(stats as any).postbackCount ?? 0} />
        <StatCard title="Game Plays" value={(stats as any).gamePlaysCount ?? 0} />
        <StatCard title="Points Awarded" value={formatPoints(stats.totalPointsAwarded)} />
        <StatCard title="Total Paid Out" value={formatCurrency(stats.totalCashPaid)} />
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight }: { title: string, value: string | number, highlight?: boolean }) {
  return (
    <Card className={`p-6 border-t-white/10 border-x-white/5 border-b-black/50 rounded-none ${highlight && value > 0 ? 'bg-primary/5 border-t-primary/50 shadow-[0_0_15px_rgba(230,57,70,0.1)]' : 'bg-black/60'}`}>
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">{title}</h3>
      <div className={`text-4xl font-black font-display tracking-tight ${highlight && value > 0 ? 'text-primary' : 'text-white'}`}>
        {value}
      </div>
    </Card>
  );
}

function OffersView() {
  const { data: offers } = useListOffers();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<any>(null);
  const deleteMutation = useDeleteOffer();

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListOffersQueryKey() });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Manage Offers</h2>
        <Button onClick={() => setIsEditing({})}>Create New Offer</Button>
      </div>

      <Card className="bg-card/50 border-white/10 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 uppercase bg-black/40 border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Points</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {offers?.map(offer => (
              <tr key={offer.id} className="text-white hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-medium">{offer.title}</td>
                <td className="px-6 py-4 text-primary">{offer.points}</td>
                <td className="px-6 py-4">{offer.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Draft</Badge>}</td>
                <td className="px-6 py-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(offer)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(offer.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <OfferModal offer={isEditing} onClose={() => setIsEditing(null)} />
    </div>
  );
}

function OfferModal({ offer, onClose }: { offer: any, onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMut = useCreateOffer();
  const updateMut = useUpdateOffer();
  
  const [formData, setFormData] = useState(offer || {});

  if (!offer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category || 'survey',
        points: parseInt(formData.points || 0),
        cashValue: parseFloat(formData.cashValue || 0),
        difficulty: formData.difficulty || 'easy',
        estimatedTime: formData.estimatedTime,
        instructions: formData.instructions,
        imageUrl: formData.imageUrl,
        isActive: formData.isActive ?? true
      };

      if (offer.id) {
        await updateMut.mutateAsync({ id: offer.id, data: payload as any });
      } else {
        await createMut.mutateAsync({ data: payload as any });
      }
      queryClient.invalidateQueries({ queryKey: getListOffersQueryKey() });
      toast({ title: "Saved!" });
      onClose();
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={!!offer} onOpenChange={(open) => !open && onClose()}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>{offer.id ? 'Edit Offer' : 'New Offer'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <Input placeholder="Title" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required />
        <Textarea placeholder="Description" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} required />
        <div className="grid grid-cols-2 gap-4">
          <Input type="number" placeholder="Points" value={formData.points || ''} onChange={e => setFormData({...formData, points: e.target.value})} required />
          <Input type="number" step="0.01" placeholder="Cash Value ($)" value={formData.cashValue || ''} onChange={e => setFormData({...formData, cashValue: e.target.value})} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="Category (e.g. game)" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} required />
          <Input placeholder="Difficulty (easy/medium/hard)" value={formData.difficulty || ''} onChange={e => setFormData({...formData, difficulty: e.target.value})} required />
        </div>
        <Input placeholder="Estimated Time (e.g. 10 mins)" value={formData.estimatedTime || ''} onChange={e => setFormData({...formData, estimatedTime: e.target.value})} required />
        <Textarea placeholder="Instructions" value={formData.instructions || ''} onChange={e => setFormData({...formData, instructions: e.target.value})} required />
        <Input placeholder="Image URL (optional)" value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={formData.isActive !== false} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
          <label className="text-white text-sm">Is Active</label>
        </div>
        <Button type="submit" className="w-full" isLoading={createMut.isPending || updateMut.isPending}>Save Offer</Button>
      </form>
    </Dialog>
  );
}

function CompletionsView() {
  const { data: completions } = useListCompletions({ status: 'pending' });
  const approveMut = useApproveCompletion();
  const rejectMut = useRejectCompletion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await approveMut.mutateAsync({ id });
      else await rejectMut.mutateAsync({ id, data: { reason: "Did not meet requirements" } });
      
      toast({ title: `Completion ${action}d` });
      queryClient.invalidateQueries({ queryKey: getListCompletionsQueryKey() });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Card className="bg-card/50 border-white/10 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-400 uppercase bg-black/40 border-b border-white/5">
          <tr>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Offer</th>
            <th className="px-6 py-4">Proof</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {completions?.map(c => (
            <tr key={c.id} className="text-white hover:bg-white/[0.02]">
              <td className="px-6 py-4">{c.user?.username}</td>
              <td className="px-6 py-4">{c.offer?.title}</td>
              <td className="px-6 py-4 max-w-xs truncate text-zinc-400">{c.proof}</td>
              <td className="px-6 py-4 flex gap-2">
                <Button size="sm" onClick={() => handleAction(c.id, 'approve')}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => handleAction(c.id, 'reject')}>Reject</Button>
              </td>
            </tr>
          ))}
          {(!completions || completions.length === 0) && (
            <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No pending completions</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function WithdrawalsView() {
  const { data: withdrawals } = useListWithdrawals();
  const approveMut = useApproveWithdrawal();
  const rejectMut = useRejectWithdrawal();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const pendingList = withdrawals?.filter(w => w.status === 'pending') || [];

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await approveMut.mutateAsync({ id });
      else await rejectMut.mutateAsync({ id, data: { reason: "Invalid details" } });
      
      toast({ title: `Withdrawal ${action}d` });
      queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Card className="bg-card/50 border-white/10 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-400 uppercase bg-black/40 border-b border-white/5">
          <tr>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Method & Details</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {pendingList.map(w => (
            <tr key={w.id} className="text-white hover:bg-white/[0.02]">
              <td className="px-6 py-4">{w.user?.username}</td>
              <td className="px-6 py-4 text-primary font-bold">{formatCurrency(w.cashAmount)}</td>
              <td className="px-6 py-4">
                <span className="capitalize text-zinc-300 block">{w.method.replace('_', ' ')}</span>
                <span className="text-xs text-zinc-500">{w.paymentDetails}</span>
              </td>
              <td className="px-6 py-4 flex gap-2">
                <Button size="sm" onClick={() => handleAction(w.id, 'approve')}>Mark Paid</Button>
                <Button size="sm" variant="destructive" onClick={() => handleAction(w.id, 'reject')}>Reject</Button>
              </td>
            </tr>
          ))}
          {pendingList.length === 0 && (
            <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No pending withdrawals</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function UsersView() {
  const { data: users } = useListUsers();

  return (
    <Card className="bg-card/50 border-white/10 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-zinc-400 uppercase bg-black/40 border-b border-white/5">
          <tr>
            <th className="px-6 py-4">Username</th>
            <th className="px-6 py-4">Email</th>
            <th className="px-6 py-4">Balance</th>
            <th className="px-6 py-4">Role</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users?.map(u => (
            <tr key={u.id} className="text-white hover:bg-white/[0.02]">
              <td className="px-6 py-4 font-medium">{u.username}</td>
              <td className="px-6 py-4 text-zinc-400">{u.email}</td>
              <td className="px-6 py-4 text-primary font-bold">{formatPoints(u.pointsBalance)} pts</td>
              <td className="px-6 py-4 capitalize">{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
