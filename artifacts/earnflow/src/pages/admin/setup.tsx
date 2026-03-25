import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Circle, Copy, ExternalLink } from "lucide-react";

type SetupData = {
  postbackUrls: Record<string, string>;
  envVarsNeeded: Record<string, string[]>;
};

type NetworkConfig = Record<string, { configured: boolean; name: string }>;

const NETWORKS = [
  {
    key: "offertoro",
    name: "OfferToro",
    type: "Offer Wall",
    logo: "🎯",
    payout: "$0.10–$50 per offer",
    signupUrl: "https://www.offertoro.com/publishers",
    steps: [
      'Go to offertoro.com/publishers and click "Join as Publisher"',
      'Fill in: Company Name = DPHMS, App Name = BRINGWAR Gaming Rewards',
      'Paste your Postback URL (copy it below) into their "Postback URL" field',
      'After approval, copy your Publisher ID and App ID',
      'Add OFFERTORO_PUB_ID and OFFERTORO_APP_ID to Replit Secrets',
    ],
    envVars: ["OFFERTORO_PUB_ID", "OFFERTORO_APP_ID", "OFFERTORO_SECRET"],
  },
  {
    key: "lootably",
    name: "Lootably",
    type: "Offer Wall",
    logo: "💎",
    payout: "$0.05–$20 per offer",
    signupUrl: "https://lootably.com/publishers",
    steps: [
      'Go to lootably.com/publishers and register as a publisher',
      'App Name = BRINGWAR Gaming Rewards, Company = DPHMS',
      'Paste your Postback URL into their publisher dashboard',
      'Copy your Placement ID after approval',
      'Add LOOTABLY_PLACEMENT_ID to Replit Secrets',
    ],
    envVars: ["LOOTABLY_PLACEMENT_ID", "LOOTABLY_SECRET"],
  },
  {
    key: "adgate",
    name: "AdGate Media",
    type: "Offer Wall",
    logo: "🏆",
    payout: "$0.10–$30 per offer",
    signupUrl: "https://adgatemedia.com/publishers",
    steps: [
      'Go to adgatemedia.com/publishers and apply',
      'Company = DPHMS, App = BRINGWAR Gaming Rewards',
      'Set your postback URL in their dashboard',
      'Copy your App ID after approval',
      'Add ADGATE_APP_ID and ADGATE_SECRET to Replit Secrets',
    ],
    envVars: ["ADGATE_APP_ID", "ADGATE_SECRET"],
  },
  {
    key: "revu",
    name: "Revenue Universe",
    type: "Offer Wall",
    logo: "🌐",
    payout: "$0.05–$15 per offer",
    signupUrl: "https://www.revenueuniverse.com/signup",
    steps: [
      'Go to revenueuniverse.com/signup and register as a publisher',
      'Company = DPHMS, App = BRINGWAR Gaming Rewards',
      'Configure your postback/pixel URL in their publisher dashboard',
      'Copy your Publisher ID',
      'Add REVU_PUB_ID to Replit Secrets',
    ],
    envVars: ["REVU_PUB_ID"],
  },
  {
    key: "torox",
    name: "Torox",
    type: "Offer Wall",
    logo: "⚡",
    payout: "$0.01–$30 per offer",
    signupUrl: "https://torox.io/signup",
    steps: [
      'Go to torox.io/signup and sign up as a publisher',
      'Company = DPHMS, Site/App = BRINGWAR Gaming Rewards',
      'Paste your Postback URL in the dashboard',
      'Copy your Publisher ID and App ID',
      'Add TOROX_PUB_ID and TOROX_APP_ID to Replit Secrets',
    ],
    envVars: ["TOROX_PUB_ID", "TOROX_APP_ID"],
  },
  {
    key: "cpx",
    name: "CPX Research",
    type: "Survey",
    logo: "📊",
    payout: "$0.50–$8 per survey",
    signupUrl: "https://publishers.cpx-research.com",
    steps: [
      'Go to publishers.cpx-research.com and apply',
      'Company = DPHMS, App = BRINGWAR Gaming Rewards',
      'Set your postback URL in their portal',
      'Copy your App ID and Secure Hash Key',
      'Add CPX_APP_ID and CPX_SECURE_HASH to Replit Secrets',
    ],
    envVars: ["CPX_APP_ID", "CPX_SECURE_HASH"],
  },
  {
    key: "bitlabs",
    name: "BitLabs",
    type: "Survey",
    logo: "🔬",
    payout: "$1–$5 per survey",
    signupUrl: "https://bitlabs.ai",
    steps: [
      'Go to bitlabs.ai and click "Publisher Sign Up"',
      'Company = DPHMS, App = BRINGWAR Gaming Rewards',
      'Configure your postback URL in dashboard settings',
      'Copy your API Token',
      'Add BITLABS_TOKEN to Replit Secrets',
    ],
    envVars: ["BITLABS_TOKEN"],
  },
  {
    key: "theoremreach",
    name: "Theorem Reach",
    type: "Survey",
    logo: "📝",
    payout: "$0.50–$10 per survey",
    signupUrl: "https://theoremreach.com/publishers",
    steps: [
      'Go to theoremreach.com/publishers and register',
      'Company = DPHMS, App = BRINGWAR Gaming Rewards',
      'Set your postback URL in the dashboard',
      'Copy your API Key',
      'Add THEOREM_API_KEY to Replit Secrets',
    ],
    envVars: ["THEOREM_API_KEY"],
  },
  {
    key: "pollfish",
    name: "Pollfish",
    type: "Survey",
    logo: "🐟",
    payout: "$0.30–$5 per survey",
    signupUrl: "https://www.pollfish.com/publisher",
    steps: [
      'Go to pollfish.com/publisher and create a publisher account',
      'Company = DPHMS, App = BRINGWAR Gaming Rewards',
      'Enable "Reward API" and set your postback URL',
      'Copy your API Key',
      'Add POLLFISH_API_KEY to Replit Secrets',
    ],
    envVars: ["POLLFISH_API_KEY"],
  },
];

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast({ title: `Copied ${label}`, description: "Paste it into the network dashboard." });
}

export default function PublisherSetup() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: setup } = useQuery<SetupData>({
    queryKey: ["admin-network-setup"],
    queryFn: () => fetch("/api/admin/network-setup").then(r => r.json()),
  });

  const { data: networks } = useQuery<NetworkConfig>({
    queryKey: ["networks-config"],
    queryFn: () => fetch("/api/networks/config").then(r => r.json()),
  });

  const configuredCount = networks
    ? Object.values(networks).filter(n => n.configured).length
    : 0;
  const total = NETWORKS.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">🔧 Publisher Setup</h1>
          <p className="text-zinc-400 mb-3">Sign up at each network as a publisher. They pay you automatically when users complete offers or surveys.</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${(configuredCount / total) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-zinc-400">{configuredCount}/{total} live</span>
          </div>
        </div>

        {/* Info box */}
        <div className="mb-6 p-4 bg-blue-950/50 border border-blue-800/50 rounded-xl">
          <p className="text-blue-300 text-sm font-bold mb-1">📋 What to fill in at every network:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-200">
            <div><span className="text-blue-400">Company Name:</span> DPHMS</div>
            <div><span className="text-blue-400">App Name:</span> BRINGWAR Gaming Rewards</div>
            <div><span className="text-blue-400">App Type:</span> Mobile & Web</div>
            <div><span className="text-blue-400">Category:</span> Gaming / Rewards</div>
          </div>
        </div>

        {/* Network cards */}
        <div className="space-y-3">
          {NETWORKS.map((net) => {
            const isConfigured = networks?.[net.key]?.configured ?? false;
            const postbackUrl = setup?.postbackUrls?.[net.key];
            const isOpen = expanded === net.key;

            return (
              <Card
                key={net.key}
                className={`border transition-all cursor-pointer ${
                  isConfigured
                    ? "border-green-700/50 bg-green-950/20"
                    : "border-zinc-800 bg-zinc-900"
                }`}
                onClick={() => setExpanded(isOpen ? null : net.key)}
              >
                <CardContent className="p-4">
                  {/* Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{net.logo}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{net.name}</span>
                          <Badge className={`text-xs ${net.type === "Survey" ? "bg-blue-700" : "bg-orange-700"} text-white`}>
                            {net.type}
                          </Badge>
                          {isConfigured && <Badge className="bg-green-700 text-white text-xs">✓ Live</Badge>}
                        </div>
                        <div className="text-xs text-green-400 mt-0.5">{net.payout}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isConfigured
                        ? <CheckCircle className="h-5 w-5 text-green-500" />
                        : <Circle className="h-5 w-5 text-zinc-600" />
                      }
                      <span className="text-zinc-500 text-xs">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Expanded steps */}
                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4" onClick={e => e.stopPropagation()}>
                      {/* Steps */}
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Setup Steps</p>
                        <ol className="space-y-2">
                          {net.steps.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm text-zinc-300">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-red-600/30 text-red-400 text-xs flex items-center justify-center font-bold">
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Postback URL */}
                      {postbackUrl && (
                        <div>
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Your Postback URL (paste this at the network)</p>
                          <div className="flex gap-2 items-center">
                            <div className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono truncate">
                              {postbackUrl}
                            </div>
                            <Button
                              size="sm"
                              className="shrink-0 bg-red-600 hover:bg-red-700 h-8"
                              onClick={() => copy(postbackUrl, "Postback URL")}
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Env vars needed */}
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Add to Replit Secrets after signup</p>
                        <div className="flex flex-wrap gap-2">
                          {net.envVars.map(v => (
                            <code key={v} className="text-xs bg-zinc-800 text-yellow-400 px-2 py-1 rounded">{v}</code>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <Button
                        className="w-full bg-white text-black hover:bg-zinc-200 font-bold"
                        onClick={() => window.open(net.signupUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Sign Up at {net.name} →
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-500">
          <strong className="text-white">How to add secrets:</strong> In your Replit project, click the 🔒 Secrets tab on the left sidebar → Add Secret → paste the variable name and value. The network goes live immediately after you save — no restart needed.
        </div>
      </div>
    </div>
  );
}
