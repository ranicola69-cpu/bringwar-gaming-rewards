import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

type NetworkConfig = {
  name: string;
  type: string;
  configured: boolean;
  iframeUrl?: string;
  logo: string;
  description: string;
  avgPayout: string;
};

export default function Surveys() {
  const { user } = useAuth();
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);

  const { data: networks } = useQuery<Record<string, NetworkConfig>>({
    queryKey: ["networks-config"],
    queryFn: async () => {
      const res = await fetch("/api/networks/config");
      return res.json();
    },
  });

  const surveyNetworks = networks
    ? Object.entries(networks).filter(([, n]) => n.type === "survey")
    : [];

  const activeConfig = activeNetwork && networks ? networks[activeNetwork] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">📊 Surveys</h1>
          <p className="text-muted-foreground">Complete surveys and earn big. All completions credited automatically.</p>
        </div>

        {/* Network selector */}
        <div className="flex flex-wrap gap-3 mb-6">
          {surveyNetworks.map(([key, net]) => (
            <button
              key={key}
              onClick={() => net.configured ? setActiveNetwork(key) : null}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                activeNetwork === key
                  ? "border-red-500 bg-red-500/10 text-white"
                  : net.configured
                  ? "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                  : "border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <span className="text-xl">{net.logo}</span>
              <div className="text-left">
                <div className="font-semibold text-sm">{net.name}</div>
                <div className="text-xs text-green-400">{net.avgPayout}</div>
              </div>
              {!net.configured && (
                <Badge className="bg-zinc-700 text-zinc-400 text-xs ml-1">Setup needed</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Active iframe */}
        {activeConfig?.iframeUrl ? (
          <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeConfig.logo}</span>
                <span className="font-bold text-white">{activeConfig.name}</span>
                <Badge className="bg-green-600 text-white text-xs">Live</Badge>
              </div>
              <p className="text-xs text-zinc-500">Points credited automatically on completion</p>
            </div>
            <iframe
              src={activeConfig.iframeUrl}
              className="w-full"
              style={{ height: "70vh", border: "none" }}
              title={activeConfig.name}
              allow="clipboard-write"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {surveyNetworks.length === 0 ? (
              <SetupGuide />
            ) : (
              <>
                <p className="text-zinc-400 text-sm mb-4">Select a survey network above to start earning.</p>
                {surveyNetworks.some(([, n]) => !n.configured) && <SetupGuide />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SetupGuide() {
  return (
    <Card className="bg-zinc-900 border-zinc-700">
      <CardContent className="p-6">
        <h3 className="text-white font-bold text-lg mb-2">🔧 Network Setup Required</h3>
        <p className="text-zinc-400 text-sm mb-4">
          To start earning from surveys, sign up as a publisher with these networks and add their IDs to your environment variables.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "CPX Research", url: "https://publishers.cpx-research.com", vars: "CPX_APP_ID, CPX_SECURE_HASH", payout: "$2–8 per survey" },
            { name: "BitLabs", url: "https://bitlabs.ai", vars: "BITLABS_TOKEN", payout: "$1–5 per survey" },
          ].map((n) => (
            <div key={n.name} className="p-3 bg-zinc-800 rounded-lg">
              <div className="font-semibold text-white">{n.name}</div>
              <div className="text-green-400 text-xs mb-1">{n.payout}</div>
              <div className="text-zinc-500 text-xs mb-2">Env vars: <code className="text-yellow-400">{n.vars}</code></div>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => window.open(n.url, "_blank")}>
                Sign Up as Publisher →
              </Button>
            </div>
          ))}
        </div>
        <p className="text-zinc-600 text-xs mt-4">
          Add the required env variables in your Replit Secrets tab, then restart the server.
        </p>
      </CardContent>
    </Card>
  );
}
