import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="space-y-6">
      <Skeleton className="h-1 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
