import { Skeleton } from "@/components/ui/skeleton";

export default function FridgeLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Search */}
      <Skeleton className="h-9 w-full rounded-md" />

      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-lg px-3.5 py-2.5 flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
