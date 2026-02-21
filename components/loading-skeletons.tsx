import { Disc3 } from 'lucide-react';

export function TrackGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="glass-card overflow-hidden animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="aspect-square bg-white/5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>
          <div className="p-2 space-y-2">
            <div className="h-4 w-3/4 bg-white/10 rounded" />
            <div className="h-3 w-1/2 bg-white/10 rounded" />
            <div className="h-3 w-2/3 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AudioPlayerSkeleton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 glass-card border-t border-white/10 z-50 animate-pulse">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 bg-white/10 rounded" />
            <div className="h-3 w-32 bg-white/5 rounded" />
          </div>
          <div className="w-48 h-12 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DiscoverySkeleton() {
  return (
    <div className="glass-card p-6 rounded-2xl animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="h-3 w-48 bg-white/5 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 bg-white/10 rounded" />
            <div className="w-12 h-12 bg-white/5 rounded-lg" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-3/4 bg-white/10 rounded" />
              <div className="h-2 w-1/2 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ message = 'No items found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="glass-card p-8 rounded-full mb-6">
        <Disc3 className="h-16 w-16 text-white/20" />
      </div>
      <p className="text-white/60">{message}</p>
    </div>
  );
}
