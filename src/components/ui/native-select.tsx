import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** <select> nativo com o visual do Input: acessível e confiável no celular. */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-transparent pr-9 pl-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30",
          className,
        )}
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-foreground/60"
        aria-hidden
      />
    </div>
  );
}
