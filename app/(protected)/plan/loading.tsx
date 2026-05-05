import { Skeleton } from "@/components/ui/skeleton";

export default function PlanLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* Day cards — liste sur mobile, grille sur desktop */}
      <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-7 md:gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            {/* Day header */}
            <div className="px-3 py-2 border-b bg-muted/30 space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            {/* Slots */}
            <div className="divide-y">
              {[0, 1].map((s) => (
                <div key={s} className="px-3 py-2.5 flex items-center gap-2 md:flex-col md:items-start md:min-h-[60px]">
                  <Skeleton className="h-3 w-8 flex-shrink-0" />
                  <Skeleton className="h-3 flex-1 md:w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
