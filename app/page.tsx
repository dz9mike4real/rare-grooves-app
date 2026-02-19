'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '@/lib/types';
import { rareTracks, loadRealAudioFromDeezer, loadAudioForTracks, getTracksWithRealArt } from '@/lib/tracks-data';
import { TrackCard } from '@/components/track-card';
import { AudioPlayer } from '@/components/audio-player';
import { FavoritesSidebar } from '@/components/favorites-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Disc3, Heart, Sparkles, X, ChevronDown, Play, SkipForward, Calendar, Loader2, ArrowUpDown } from 'lucide-react';
import { DiscoveryButton, DiscoveryPanel } from '@/components/discovery';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/error-boundary';
import { PAGINATION, DEBOUNCE } from '@/lib/constants';

const ITEMS_PER_PAGE = PAGINATION.ITEMS_PER_PAGE;

// Default initial state (same for server and client)
const defaultTracks = rareTracks;
const defaultSorted = [...defaultTracks].sort((a, b) => b.rarity - a.rarity);

export default function Home() {
  const { toast } = useToast();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [tracksWithCovers, setTracksWithCovers] = useState<Track[]>(defaultTracks);
  const [displayedTracks, setDisplayedTracks] = useState<Track[]>(() => defaultSorted.slice(0, ITEMS_PER_PAGE));
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [totalFilteredCount, setTotalFilteredCount] = useState(defaultTracks.length);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [queue, setQueue] = useState<Track[]>(defaultSorted);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [discoveredTracks, setDiscoveredTracks] = useState<Track[]>([]);
  const [sortBy, setSortBy] = useState<'rarity' | 'year-desc' | 'year-asc' | 'title' | 'artist'>('rarity');
  const [loadedCount, setLoadedCount] = useState(0);
  const hasInitialized = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for search (/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update tab title with now playing
  useEffect(() => {
    if (selectedTrack) {
      document.title = `${selectedTrack.title} - ${selectedTrack.artist} | Rare Grooves`;
    } else {
      document.title = 'Rare Grooves | Discover Rare Musical Gems';
    }
  }, [selectedTrack]);

  // Load real audio on mount - check cache first
  useEffect(() => {
    const loadTracks = async () => {
      console.log('[v0] Loading tracks...');
      
      try {
        // Check localStorage cache first
        let tracksWithRealAudio: Track[] | null = null;
        
        try {
          const cached = localStorage.getItem('rare-grooves-tracks');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
              console.log('[v0] Using cached track data');
              tracksWithRealAudio = parsed.tracks;
            }
          }
        } catch (e) {
          // Ignore cache errors
        }
        
        // If no cache, fetch fresh data
        if (!tracksWithRealAudio) {
          tracksWithRealAudio = await loadRealAudioFromDeezer(rareTracks);
          
          // Cache for 24 hours
          localStorage.setItem('rare-grooves-tracks', JSON.stringify({
            tracks: tracksWithRealAudio,
            timestamp: Date.now()
          }));
        }
        
        setTracksWithCovers(tracksWithRealAudio);
        setDisplayedTracks(
          tracksWithRealAudio
            .sort((a, b) => b.rarity - a.rarity)
            .slice(0, ITEMS_PER_PAGE)
        );
        setQueue(tracksWithRealAudio.sort((a, b) => b.rarity - a.rarity));
        
        const loaded = tracksWithRealAudio.filter(t => t.audioUrl.startsWith('http')).length;
        setLoadedCount(loaded);
        if (loaded === 0) {
          toast({
            title: 'Using demo audio',
            description: 'Could not load real previews. Using generated audio instead.',
            variant: 'default'
          });
        }
      } catch (error) {
        console.error('[v0] Failed to load tracks:', error);
        toast({
          title: 'Loading issue',
          description: 'Some tracks may not have preview audio.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingAudio(false);
        hasInitialized.current = true;
      }
    };
    
    loadTracks();
  }, []);

  // Apply filters
  const applyFilters = useCallback((tracks: Track[], resetVisible = true) => {
    let filtered = [...tracks];

    // Filter by genre
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(t => t.genre === selectedGenre);
    }

    // Filter by year
    if (selectedYear !== 'all') {
      const yearRange = selectedYear.split('-');
      if (yearRange.length === 2) {
        const startYear = parseInt(yearRange[0]);
        const endYear = parseInt(yearRange[1]);
        filtered = filtered.filter(t => t.year >= startYear && t.year <= endYear);
      }
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(track =>
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.album.toLowerCase().includes(query)
      );
    }

    // Sort tracks
    switch (sortBy) {
      case 'rarity':
        filtered = filtered.sort((a, b) => b.rarity - a.rarity);
        break;
      case 'year-desc':
        filtered = filtered.sort((a, b) => b.year - a.year);
        break;
      case 'year-asc':
        filtered = filtered.sort((a, b) => a.year - b.year);
        break;
      case 'title':
        filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'artist':
        filtered = filtered.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
    }

    setTotalFilteredCount(filtered.length);
    setDisplayedTracks(resetVisible ? filtered.slice(0, ITEMS_PER_PAGE) : filtered);
    setVisibleCount(resetVisible ? ITEMS_PER_PAGE : filtered.length);
    setQueue(filtered);
    setQueueIndex(selectedTrack ? filtered.findIndex(t => t.id === selectedTrack.id) : -1);
  }, [selectedGenre, selectedYear, searchQuery, selectedTrack, sortBy]);

  // Apply filters when they change
  useEffect(() => {
    if (!isLoadingAudio && tracksWithCovers.length > 0) {
      applyFilters(tracksWithCovers);
    }
  }, [selectedGenre, selectedYear, searchQuery, isLoadingAudio, tracksWithCovers, applyFilters]);

  // Infinite scroll observer
  useEffect(() => {
    if (isLoadingAudio || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < totalFilteredCount) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, totalFilteredCount, isLoadingAudio, isLoadingMore]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    
    // Lazy load audio for newly visible tracks
    const tracksNeedingAudio = tracksWithCovers
      .filter(t => !t.audioUrl.startsWith('http'))
      .slice(0, 20);
    
    if (tracksNeedingAudio.length > 0) {
      const updatedTracks = await loadAudioForTracks(tracksNeedingAudio);
      setTracksWithCovers(prev => {
        const updatedMap = new Map(updatedTracks.map(t => [t.id, t]));
        return prev.map(t => updatedMap.get(t.id) || t);
      });
    }
    
    setTimeout(() => {
      // Get all filtered tracks
      let allFiltered = [...tracksWithCovers];
      
      if (selectedGenre !== 'all') {
        allFiltered = allFiltered.filter(t => t.genre === selectedGenre);
      }
      
      if (selectedYear !== 'all') {
        const yearRange = selectedYear.split('-');
        if (yearRange.length === 2) {
          const startYear = parseInt(yearRange[0]);
          const endYear = parseInt(yearRange[1]);
          allFiltered = allFiltered.filter(t => t.year >= startYear && t.year <= endYear);
        }
      }
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        allFiltered = allFiltered.filter(track =>
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query) ||
          track.album.toLowerCase().includes(query)
        );
      }
      
      if (!searchQuery && selectedGenre === 'all' && selectedYear === 'all') {
        allFiltered = allFiltered.sort((a, b) => b.rarity - a.rarity);
      }
      
      setTotalFilteredCount(allFiltered.length);
      const newVisibleCount = Math.min(visibleCount + ITEMS_PER_PAGE, allFiltered.length);
      setDisplayedTracks(allFiltered.slice(0, newVisibleCount));
      setVisibleCount(newVisibleCount);
      setIsLoadingMore(false);
    }, DEBOUNCE.SEARCH_DELAY_MS);
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    setSearchQuery('');
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTrackSelect = async (track: Track) => {
    // Lazy load audio if not loaded yet
    if (!track.audioUrl.startsWith('http')) {
      const updated = await loadAudioForTracks([track]);
      const updatedTrack = updated[0];
      setTracksWithCovers(prev => prev.map(t => t.id === track.id ? updatedTrack : t));
      setSelectedTrack(updatedTrack);
    } else {
      setSelectedTrack(track);
    }
    
    const idx = queue.findIndex(t => t.id === track.id);
    if (idx !== -1) {
      setQueueIndex(idx);
    }
  };

  const handlePlayTrack = async (track: Track) => {
    // Lazy load audio if not loaded yet
    if (!track.audioUrl.startsWith('http')) {
      const updated = await loadAudioForTracks([track]);
      const updatedTrack = updated[0];
      setTracksWithCovers(prev => prev.map(t => t.id === track.id ? updatedTrack : t));
      setSelectedTrack(updatedTrack);
    } else {
      setSelectedTrack(track);
    }
    setIsFavoritesOpen(false);
  };

  const playNext = () => {
    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      setSelectedTrack(queue[nextIdx]);
    }
  };

  const playPrevious = () => {
    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      setQueueIndex(prevIdx);
      setSelectedTrack(queue[prevIdx]);
    }
  };

  const playAll = () => {
    if (displayedTracks.length > 0) {
      setQueue(displayedTracks);
      setQueueIndex(0);
      setSelectedTrack(displayedTracks[0]);
    }
  };

  const genres = [
    { value: 'all', label: 'All Genres', icon: Sparkles },
    { value: 'jazz', label: 'Jazz' },
    { value: 'funk', label: 'Funk' },
    { value: 'soul', label: 'Soul' },
    { value: 'r&b', label: 'R&B' },
    { value: 'reggae', label: 'Reggae' },
    { value: 'afrobeat', label: 'Afrobeat' },
  ];

  const years = [
    { value: 'all', label: 'All Years' },
    { value: '1960-1969', label: '1960s' },
    { value: '1970-1979', label: '1970s' },
    { value: '1980-1989', label: '1980s' },
    { value: '1990-1999', label: '1990s' },
    { value: '2000-2009', label: '2000s' },
    { value: '2010-2024', label: '2010s+' },
  ];

  const sortOptions = [
    { value: 'rarity', label: 'Rarest First' },
    { value: 'year-desc', label: 'Newest First' },
    { value: 'year-asc', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'artist', label: 'Artist A-Z' },
  ];

  const hasActiveFilters = searchQuery || selectedGenre !== 'all' || selectedYear !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
    setSelectedYear('all');
  };

  const getSectionTitle = () => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (selectedYear !== 'all') return `${selectedYear.replace('-', 's')} Tracks`;
    if (selectedGenre !== 'all') return `${selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Tracks`;
    return 'Rarest Tracks';
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0a4d7f]/10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-[#0d6efd]/10 rounded-full blur-3xl" />
      </div>

      {/* Glass Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="gradient-bg p-2 rounded-xl">
                <Disc3 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold gradient-text hidden sm:block">Rare Grooves</h1>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search tracks, artists, albums... (press /)"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-full focus:ring-1 focus:ring-[#0a4d7f] focus:border-[#0a4d7f]"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsFavoritesOpen(true)}
              className="relative hover:bg-white/10 flex-shrink-0"
            >
              <Heart className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <ErrorBoundary>
        <main className="container mx-auto px-4 pb-40 pt-8">
        {!searchQuery && !selectedYear && (
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Discover Rare</span>
              <br />
              <span className="text-white">Musical Gems</span>
            </h2>
            <p className="text-lg text-white/60">
              Explore rare jazz, funk, soul, and more.
            </p>
          </div>
        )}

        {/* Filters Row */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Genre Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-1">
            {genres.map((genre) => (
              <button
                key={genre.value}
                onClick={() => handleGenreChange(genre.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGenre === genre.value
                    ? 'gradient-bg text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {genre.value === 'all' && <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />}
                {genre.label}
              </button>
            ))}
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-white/40" />
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="bg-white/5 border border-white/10 text-white/60 rounded-full px-3 py-2 text-sm focus:ring-1 focus:ring-[#0a4d7f]"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value} className="bg-[#181818]">
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-white/40" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-white/5 border border-white/10 text-white/60 rounded-full px-3 py-2 text-sm focus:ring-1 focus:ring-[#0a4d7f]"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#181818]">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          {/* Play All Button */}
          {displayedTracks.length > 0 && (
            <>
              <DiscoveryButton
                tracks={tracksWithCovers}
                onDiscover={(discovered) => {
                  setDiscoveredTracks(discovered);
                  setIsDiscoveryOpen(true);
                }}
                currentTrack={selectedTrack}
              />
              <Button
                onClick={playAll}
                className="gradient-bg hover:opacity-90"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Play All
              </Button>
            </>
          )}
        </div>

        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{getSectionTitle()}</h3>
            <p className="text-sm text-white/50">
              {isLoadingAudio ? (
                <span className="text-[#0a4d7f]">Loading real tracks and album art...</span>
              ) : (
                <>
                  {totalFilteredCount} {totalFilteredCount === 1 ? 'track' : 'tracks'}
                  {visibleCount < totalFilteredCount && ` (showing ${visibleCount})`}
                  {loadedCount > 0 && ` • ${loadedCount} with real audio`}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoadingAudio ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div key={i} className="glass-card overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/10" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                  <div className="h-3 w-1/2 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
        {/* Tracks Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {displayedTracks.slice(0, visibleCount).map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onPlay={handleTrackSelect}
              isPlaying={selectedTrack?.id === track.id}
              onFavoriteToggle={() => setIsFavoritesOpen(true)}
            />
          ))}
        </div>

        {/* Load More Trigger - Infinite Scroll Only */}
        {visibleCount < totalFilteredCount && !isLoadingAudio && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            <p className="text-white/40 text-sm">
              Scroll for more ({totalFilteredCount - visibleCount} remaining)
            </p>
          </div>
        )}
          </>
        )}

        {displayedTracks.length === 0 && !isLoadingAudio && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="glass-card p-8 rounded-full mb-6">
              <Disc3 className="h-16 w-16 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No tracks found</h3>
            <p className="text-white/50 max-w-md">
              {searchQuery 
                ? `No results for "${searchQuery}". Try a different search term.`
                : 'Try adjusting your filters to discover rare grooves.'
              }
            </p>
          </div>
        )}
        </main>
      </ErrorBoundary>

      {/* Favorites Sidebar */}
      <FavoritesSidebar
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        tracks={tracksWithCovers}
        onPlayTrack={handlePlayTrack}
        currentlyPlayingId={selectedTrack?.id}
      />

      {/* Discovery Panel */}
      <DiscoveryPanel
        isOpen={isDiscoveryOpen}
        onClose={() => setIsDiscoveryOpen(false)}
        discoveredTracks={discoveredTracks}
        onPlayTrack={(track) => {
          setSelectedTrack(track);
          setQueue(discoveredTracks);
          setQueueIndex(discoveredTracks.findIndex(t => t.id === track.id));
        }}
      />

      {/* Audio Player */}
      {selectedTrack && (
        <AudioPlayer
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
          onNext={playNext}
          onPrevious={playPrevious}
          hasNext={queueIndex < queue.length - 1}
          hasPrevious={queueIndex > 0}
        />
      )}
    </div>
  );
}
