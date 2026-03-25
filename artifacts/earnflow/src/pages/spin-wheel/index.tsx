import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type WheelStatus = {
  canSpin: boolean;
  lastWin: { pts: number; label: string } | null;
  segments: { label: string; pts: number; color: string }[];
  resetsAt: string;
};

type SpinResult = { pts: number; label: string; segmentIndex: number };

function drawWheel(canvas: HTMLCanvasElement, segments: WheelStatus["segments"], rotation: number) {
  const ctx = canvas.getContext("2d")!;
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
    ctx.fillText(seg.label, r - 10, 5);
    ctx.restore();
  });

  // Center hub
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
  ctx.fillStyle = "#18181b";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();
}

export default function SpinWheel() {
  const qc = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const rotationRef = useRef(0);

  const { data: status } = useQuery<WheelStatus>({
    queryKey: ["spin-wheel-status"],
    queryFn: () => fetch("/api/games/spin-wheel/status").then(r => r.json()),
    onSuccess: (data) => {
      if (canvasRef.current && data.segments.length) {
        drawWheel(canvasRef.current, data.segments, rotationRef.current);
      }
    },
  } as any);

  const spinMutation = useMutation({
    mutationFn: () =>
      fetch("/api/games/spin-wheel/spin", { method: "POST" }).then(async r => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json() as Promise<SpinResult>;
      }),
    onSuccess: (data) => {
      if (!status?.segments || !canvasRef.current) return;

      const segs = status.segments;
      const arc = (2 * Math.PI) / segs.length;
      // Target: land on the winning segment
      const targetAngle = -(data.segmentIndex * arc + arc / 2);
      const spins = 5 * 2 * Math.PI;
      const finalRot = targetAngle + spins;
      const duration = 4000;
      const start = performance.now();
      const startRot = rotationRef.current;

      const animate = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - t, 3);
        rotationRef.current = startRot + finalRot * ease;

        if (canvasRef.current) drawWheel(canvasRef.current, segs, rotationRef.current);

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
      animRef.current = requestAnimationFrame(animate);
    },
    onError: (err: Error) => {
      setSpinning(false);
      toast({ title: "Can't spin", description: err.message, variant: "destructive" });
    },
    onMutate: () => setSpinning(true),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <h1 className="text-4xl font-black text-white mb-1 uppercase tracking-tight">🎡 Spin & Win</h1>
        <p className="text-zinc-400 mb-6">One free spin per day. Up to 200 pts!</p>

        {/* Pointer */}
        <div className="flex justify-center mb-1">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
        </div>

        {/* Wheel */}
        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="rounded-full shadow-[0_0_40px_rgba(139,92,246,0.4)]"
            ref={(el) => {
              (canvasRef as any).current = el;
              if (el && status?.segments?.length) {
                drawWheel(el, status.segments, rotationRef.current);
              }
            }}
          />
        </div>

        {/* Result banner */}
        {result && (
          <div className="mb-6 py-3 px-6 bg-green-900/40 border border-green-600/50 rounded-xl">
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
      </div>
    </div>
  );
}
