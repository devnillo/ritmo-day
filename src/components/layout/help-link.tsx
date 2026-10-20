import { LifeBuoyIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Acesso permanente à página de ajuda (docs/SPEC.md §8). */
export function HelpLink({ className }: { className?: string }) {
  return (
    <Link
      href="/help"
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-sm text-foreground/80 underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <LifeBuoyIcon className="size-4" aria-hidden />
      Precisa de ajuda agora?
    </Link>
  );
}
