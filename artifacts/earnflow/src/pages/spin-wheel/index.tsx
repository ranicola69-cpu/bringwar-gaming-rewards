import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type Segment = { label: string; pts: number; color: string };

type WheelStatus = {
  canSpin: boolean;
  lastWin: { pts: number; label: string } | null;
  segments: Segment[];
  resetsAt: string;
};

type SpinResult = { pts: number; label: string; segmentIndex: number };

function drawWheel(canvas: HTMLCanvasElement, segments: Segment[], rotation: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = cx - 8;
  const arc = (2 * Math.PI) / segments.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  segments.forEach((seg, i) => {
    const start = rotation + i * arc;
    const end = start + arc;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 4;
    ctx.fillText(seg.label, r - 10, 5);
    ctx.restore();
  });

  // Center hub
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
  ctx.fillStyle = "#09090b";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();
}

export default function SpinWheel() {
  const qc = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);

  const { data: status } = useQuery<WheelStatus>({
    queryKey: ["spin-wheel-status"],
    queryFn: () => fetch("/api/games/spin-wheel/status").then(r => r.json()),
  });

  // Draw wheel whenever status loads
  useEffect(() => {
    if (status?.segments?.length && canvasRef.current) {
      drawWheel(canvasRef.current, status.segments, rotationRef.current);
    }
  }, [status]);

  const spinMutation = useMutation({
    mutationFn: () =>
      fetch("/api/games/spin-wheel/spin", { method: "POST" }).then(async r => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json() as Promise<SpinResult>;
      }),
    onMutate: () => setSpinning(true),
    onError: (err: Error) => {
      setSpinning(false);
      toast({ title: "Can't spin", description: err.message, variant: "destructive" });
    },
    onSuccess: (data) => {
      if (!status?.segments?.length || !canvasRef.current) return;

      const segs = status.segments;
      const arc = (2 * Math.PI) / segs.length;
      const targetAngle = -(data.segmentIndex * arc + arc / 2);
      const spins = 5 * 2 * Math.PI;
      const finalDelta = targetAngle + spins;
      const duration = 4000;
      const startTime = performance.now();
      const startRot = rotationRef.current;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
        rotationRef.current = startRot + finalDelta * ease;

        if (canvasRef.current) {
          drawWheel(canvasRef.current, segs, rotationRef.current);
        }

        if (t < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          setSpinning(false);
          setResult(data);
          toast({ title: `🎉 +${data.pts} pts!`, description: `You landed on ${data.label}` });
          qc.invalidateQueries({ queryKey: ["spin-wheel-status"] });
          qc.invalidateQueries({ queryKey: ["me"] });
        }
      };

      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(animate);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <h1 className="text-4xl font-black text-white mb-1 uppercase tracking-tight">🎡 Spin & Win</h1>
        <p className="text-zinc-400 mb-5">One free spin per day. Up to 200 pts!</p>

        {/* Pointer */}
        <div className="flex justify-center mb-1">
          <div
            className="w-0 h-0 drop-shadow-lg"
            style={{
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "24px solid white",
            }}
          />
        </div>

        {/* Canvas wheel */}
        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="rounded-full shadow-[0_0_40px_rgba(139,92,246,0.4)]"
          />
        </div>

        {/* Win banner */}
        {result && (
          <div className="mb-5 py-3 px-6 bg-green-900/40 border border-green-600/50 rounded-xl">
            <p className="text-green-300 font-black text-2xl">+{result.pts} pts</p>
            <p className="text-green-500 text-sm">{result.label} — credited to your balance!</p>
          </div>
        )}

        <Button
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-5 text-lg font-bold disabled:opacity-40"
          disabled={!status?.canSpin || spinning}
          onClick={() => spinMutation.mutate()}
        >
          {spinning ? "Spinning..." : status?.canSpin ? "🎡 Spin Now — FREE" : "✅ Come Back Tomorrow"}
        </Button>

        {status?.lastWin && !result && (
          <p className="text-zinc-600 text-sm mt-4">
            Last spin: <span className="text-zinc-400">{status.lastWin.label} (+{status.lastWin.pts} pts)</span>
          </p>
        )}

        {/* Segments legend */}
        {status?.segments && (
          <div className="mt-10 text-left">
            <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-3">Prize Segments</h3>
            <div className="grid grid-cols-4 gap-2">
              {status.segments.map((s) => (
                <div key={s.label} className="rounded-lg p-2 text-center" style={{ background: s.color + "33", border: `1px solid ${s.color}55` }}>
                  <div className="font-black text-white text-sm">{s.pts}</div>
                  <div className="text-xs text-zinc-400">pts</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
