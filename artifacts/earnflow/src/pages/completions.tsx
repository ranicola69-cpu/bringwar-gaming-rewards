import { useAuth } from "@/hooks/use-auth";
import { useGetUserCompletions } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2, Activity } from "lucide-react";

export default function MyCompletions() {
  const { user } = useAuth();
  const { data: completions, isLoading } = useGetUserCompletions(user?.id || 0, {
    query: { enabled: !!user?.id }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-white">Activity History</h1>
            <p className="text-zinc-400">Track your submitted offers and their status.</p>
          </div>
        </div>

        <Card className="border-white/10 bg-card/50 overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : !completions || completions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">No activity found. Go complete some offers!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 uppercase bg-black/40 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-medium">Offer</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Points</th>
                    <th className="px-6 py-4 font-medium">Admin Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {completions.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{c.offer?.title || `Offer #${c.offerId}`}</td>
                      <td className="px-6 py-4 text-zinc-400">{format(new Date(c.createdAt), "MMM d, yyyy")}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-4 text-primary font-bold">{c.pointsAwarded ? `+${c.pointsAwarded}` : '-'}</td>
                      <td className="px-6 py-4 text-zinc-500 max-w-[200px] truncate" title={c.adminNotes || ""}>
                        {c.adminNotes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved': return <Badge variant="success">Approved</Badge>;
    case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="warning">Pending</Badge>;
  }
}
