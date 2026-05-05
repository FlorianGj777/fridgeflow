import { Skeleton } from "@/components/ui/skeleton";

export default function ShoppingLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 md:max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full" />

      {/* Category 1 */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg px-3 py-2.5 flex items-center gap-2.5">
            <Skeleton className="h-[18px] w-[18px] rounded-full flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        ))}
      </div>

      {/* Category 2 */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border rounded-lg px-3 py-2.5 flex items-center gap-2.5">
            <Skeleton className="h-[18px] w-[18px] rounded-full flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
