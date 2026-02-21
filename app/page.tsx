'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '@/lib/types';
import { rareTracks, loadRealAudioFromDeezer, loadAudioForTracks } from '@/lib/tracks-data';
import { TrackCard } from '@/components/track-card';
import { TrackCardErrorBoundary } from '@/components/track-card-error-boundary';
import { AudioPlayer } from '@/components/audio-player';
import { FavoritesSidebar } from '@/components/favorites-sidebar';
import { LoadingProgress } from '@/components/loading-progress';
import { TrackGridSkeleton } from '@/components/loading-skeletons';
import { StaggerContainer, StaggerItem } from '@/components/stagger-grid';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Disc3, Heart, Sparkles, X, Play, Calendar, ArrowUpDown } from 'lucide-react';
import { DiscoveryButton, DiscoveryPanel } from '@/components/discovery';
import { SurpriseMeButton, RecentlyPlayed, useRecentlyPlayed } from '@/components/discovery-enhanced';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/error-boundary';
import { ClientOnly } from '@/components/client-only';
import { PAGINATION } from '@/lib/constants';
import { hasRealAudioUrl } from '@/lib/utils';

const ITEMS_PER_PAGE = PAGINATION.ITEMS_PER_PAGE;
const SEARCH_DEBOUNCE_MS = 300;

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
  const [tracksWithCovers, setTracksWithCovers] = useState<Track[]>(defaultTracks);
  const [displayedTracks, setDisplayedTracks] = useState<Track[]>(defaultSorted);
  const [totalFilteredCount, setTotalFilteredCount] = useState(defaultTracks.length);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [queue, setQueue] = useState<Track[]>(defaultSorted);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [discoveredTracks, setDiscoveredTracks] = useState<Track[]>([]);
  const [sortBy, setSortBy] = useState<'rarity' | 'year-desc' | 'year-asc' | 'title' | 'artist'>('rarity');
  const [loadedCount, setLoadedCount] = useState(0);
  const [focusedTrackIndex, setFocusedTrackIndex] = useState(-1);
  const hasInitialized = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Recently played hook
  const { recentTracks, addToRecentlyPlayed, clearRecentlyPlayed } = useRecentlyPlayed();
  
  // Keyboard navigation for track grid
  // (state defined above)

  // Keyboard shortcut for search (/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      
      // Arrow key navigation for tracks
      if (displayedTracks.length === 0) return;
      
      const gridCols = window.innerWidth >= 1280 ? 5 : window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 2;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedTrackIndex(prev => {
          const next = prev + gridCols;
          return next < displayedTracks.length ? next : prev;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedTrackIndex(prev => {
          const next = prev - gridCols;
          return next >= 0 ? next : prev;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedTrackIndex(prev => {
          const next = prev + 1;
          return next < displayedTracks.length ? next : prev;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedTrackIndex(prev => {
          const next = prev - 1;
          return next >= 0 ? next : prev;
        });
      } else if (e.key === 'Enter' && focusedTrackIndex >= 0) {
        e.preventDefault();
        handleTrackSelect(displayedTracks[focusedTrackIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedTracks, focusedTrackIndex]);

  // Debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update tab title with now playing
  useEffect(() => {
    if (selectedTrack) {
      document.title = `${selectedTrack.title} - ${selectedTrack.artist} | Rare Grooves`;
    } else {
      document.title = 'Rare Grooves | Discover Rare Musical Gems';
    }
  }, [selectedTrack]);

  // Load real audio on mount (client-side only)
  useEffect(() => {
    const loadTracks = async () => {
      console.log('[v0] Loading tracks...');
      
      try {
        const tracksWithRealAudio = await loadRealAudioFromDeezer(
          rareTracks,
          40,
          (loaded) => {
            setLoadedCount(loaded);
          }
        );
        
        setTracksWithCovers(tracksWithRealAudio);
        setDisplayedTracks(
          tracksWithRealAudio
            .sort((a, b) => b.rarity - a.rarity)
        );
        setQueue(tracksWithRealAudio.sort((a, b) => b.rarity - a.rarity));
        
        const loaded = tracksWithRealAudio.filter(t => hasRealAudioUrl(t.audioUrl)).length;
        setLoadedCount(loaded);
        // Don't show toast - it's expected that rare tracks won't have previews
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
  const applyFilters = useCallback((tracks: Track[]) => {
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
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
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
    setDisplayedTracks(filtered);
    setQueue(filtered);
    setQueueIndex(selectedTrack ? filtered.findIndex(t => t.id === selectedTrack.id) : -1);
  }, [selectedGenre, selectedYear, debouncedSearchQuery, selectedTrack, sortBy]);

  // Apply filters when they change
  useEffect(() => {
    if (!isLoadingAudio && tracksWithCovers.length > 0) {
      applyFilters(tracksWithCovers);
    }
  }, [selectedGenre, selectedYear, debouncedSearchQuery, isLoadingAudio, tracksWithCovers, applyFilters]);

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
    if (!hasRealAudioUrl(track.audioUrl)) {
      const updated = await loadAudioForTracks([track]);
      const updatedTrack = updated[0];
      setTracksWithCovers(prev => prev.map(t => t.id === track.id ? updatedTrack : t));
      setSelectedTrack(updatedTrack);
      addToRecentlyPlayed(updatedTrack);
    } else {
      setSelectedTrack(track);
      addToRecentlyPlayed(track);
    }
    
    const idx = queue.findIndex(t => t.id === track.id);
    if (idx !== -1) {
      setQueueIndex(idx);
    }
  };

  const handlePlayTrack = async (track: Track) => {
    // Lazy load audio if not loaded yet
    if (!hasRealAudioUrl(track.audioUrl)) {
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
    <div className="min-h-screen bg-background text-foreground">
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
            <Disc3 className="h-5 w-5 text-foreground" />
          </div>
          
          <h1 className="text-xl font-bold gradient-text hidden sm:block">Rare Grooves</h1>
        </div>
        
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search tracks, artists, albums... (press /)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-8 py-2 bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-full focus:ring-1 focus:ring-[#0a4d7f] focus:border-[#0a4d7f]"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
          className="relative hover:bg-secondary flex-shrink-0"
        >
          <Heart className="h-5 w-5 text-foreground" />
        </Button>

        <ThemeToggle />
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
              <span className="text-foreground">Musical Gems</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Explore rare jazz, funk, soul, and more.
            </p>
          </div>
        )}

        {/* Filters Row */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Genre Pills */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
            {genres.map((genre) => (
              <button
                key={genre.value}
                onClick={() => handleGenreChange(genre.value)}
                className={`flex-shrink-0 px-2 py-1 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-sm font-medium transition-all ${
                  selectedGenre === genre.value
                    ? 'gradient-bg text-white'
                    : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {genre.value === 'all' && <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline mr-1 sm:mr-1.5" />}
                {genre.label}
              </button>
            ))}
          </div>

          {/* Year & Sort Filters */}
          <div className="flex items-center gap-2">
            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="bg-background/80 border border-border text-foreground rounded-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-1 focus:ring-primary w-20 sm:w-auto"
              >
                {years.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="hidden sm:flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-background/80 border border-border text-foreground rounded-full px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:ring-1 focus:ring-primary w-24 sm:w-auto"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          {/* Surprise Me Button */}
          <SurpriseMeButton
            tracks={tracksWithCovers}
            onPlayTrack={(track) => {
              handleTrackSelect(track);
              addToRecentlyPlayed(track);
            }}
            selectedTrack={selectedTrack}
          />

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
        <ClientOnly
          fallback={
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
          }
        >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">{getSectionTitle()}</h3>
            <p className="text-sm text-muted-foreground">
              {isLoadingAudio ? (
                <span className="text-[#0a4d7f]">Loading real tracks and album art...</span>
              ) : (
                <>
                  {totalFilteredCount} {totalFilteredCount === 1 ? 'track' : 'tracks'}
                  {loadedCount > 0 && ` • ${loadedCount} with real audio`}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Recently Played Section */}
        {!isLoadingAudio && recentTracks.length > 0 && (
          <RecentlyPlayed
            recentTracks={recentTracks}
            onPlayTrack={(track) => {
              handleTrackSelect(track);
              addToRecentlyPlayed(track);
            }}
            onClear={clearRecentlyPlayed}
          />
        )}

        {/* Loading State */}
        {isLoadingAudio ? (
          <div className="space-y-8">
            <LoadingProgress 
              total={rareTracks.length} 
              loaded={loadedCount} 
              label="Loading album art & audio..."
            />
            <TrackGridSkeleton count={ITEMS_PER_PAGE} />
          </div>
        ) : (
          <>
            {/* Tracks Grid with Stagger Animation */}
            <StaggerContainer 
              key={`${selectedGenre}-${selectedYear}-${searchQuery}-${sortBy}`}
              staggerDelay={0.03}
            >
              {displayedTracks.map((track, index) => (
                <StaggerItem key={track.id}>
                  <TrackCardErrorBoundary trackId={track.id}>
                    <TrackCard
                      track={track}
                      onPlay={handleTrackSelect}
                      isPlaying={selectedTrack?.id === track.id}
                      onFavoriteToggle={() => setIsFavoritesOpen(true)}
                      index={index}
                      isFocused={focusedTrackIndex === index}
                    />
                  </TrackCardErrorBoundary>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </>
        )}

        {displayedTracks.length === 0 && !isLoadingAudio && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="glass-card p-8 rounded-full mb-6">
              <Disc3 className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No tracks found</h3>
            <p className="text-muted-foreground max-w-md">
              {searchQuery 
                ? `No results for "${searchQuery}". Try a different search term.`
                : 'Try adjusting your filters to discover rare grooves.'
              }
            </p>
          </motion.div>
        )}
        </ClientOnly>
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
