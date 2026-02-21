export function TrackCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/10" />
      <div className="p-2 space-y-1">
        <div className="h-4 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-1/2 bg-white/10 rounded" />
        <div className="h-3 w-2/3 bg-white/10 rounded mt-2" />
      </div>
    </div>
  );
}
