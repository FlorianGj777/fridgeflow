import { Skeleton } from "@/components/ui/skeleton";

export default function MealsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Search */}
      <Skeleton className="h-9 w-full rounded-md" />

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-3.5 space-y-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-14 rounded" />
              <Skeleton className="h-4 w-18 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
