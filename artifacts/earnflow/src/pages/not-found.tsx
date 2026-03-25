import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
      <div className="p-4 bg-destructive/10 text-destructive rounded-full mb-6">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-bold font-display text-white mb-4">404 - Page Not Found</h1>
      <p className="text-zinc-400 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg">Return Home</Button>
      </Link>
    </div>
  );
}
