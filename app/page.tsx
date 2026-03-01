'use client';

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { Track } from '@/lib/types';
import { rareTracks, getLocalTracks } from '@/lib/tracks-data';
import { TrackCard } from '@/components/track-card';
import { TrackCardErrorBoundary } from '@/components/track-card-error-boundary';
import { AudioPlayer } from '@/components/audio-player';
import { FavoritesSidebar } from '@/components/favorites-sidebar';
import { LoadingProgress } from '@/components/loading-progress';
import { TrackGridSkeleton } from '@/components/loading-skeletons';
import { StaggerContainer, StaggerItem } from '@/components/stagger-grid';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button, TextInput, ActionIcon, Menu } from '@mantine/core';
import { Search, Disc3, Heart, Sparkles, X, Play, SlidersHorizontal, ListFilter } from 'lucide-react';
import { DiscoveryButton, DiscoveryPanel } from '@/components/discovery';
import { SurpriseMeButton, RecentlyPlayed, useRecentlyPlayed } from '@/components/discovery-enhanced';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/error-boundary';
import { ClientOnly } from '@/components/client-only';
import { VirtualizedTrackGrid } from '@/components/virtualized-track-grid';
import { PAGINATION } from '@/lib/constants';
import { GenreExplorer } from '@/components/genre-explorer';

const ITEMS_PER_PAGE = PAGINATION.ITEMS_PER_PAGE;
const SEARCH_DEBOUNCE_MS = 300;

// Default initial state (same for server and client)
const defaultTracks = rareTracks;
const defaultSorted = [...defaultTracks].sort((a, b) => b.rarity - a.rarity);

export default function Home() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
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

  // Load local tracks on mount
  useEffect(() => {
    const loadTracks = async () => {
      console.log('[v0] Loading tracks...');

      try {
        // Use local downloaded tracks (175 tracks with 30-sec previews)
        const localTracks = getLocalTracks();
        console.log('[v0] Local tracks:', localTracks.length);

        if (localTracks.length > 0) {
          const sortedTracks = localTracks.sort((a: Track, b: Track) => b.rarity - a.rarity);

          setTracksWithCovers(sortedTracks);
          setDisplayedTracks(sortedTracks);
          setQueue(sortedTracks);
          setLoadedCount(sortedTracks.length);

          toast({
            title: 'Tracks loaded',
            description: `Loaded ${sortedTracks.length} tracks with audio`,
          });
        }
      } catch (error) {
        console.error('[v0] Failed to load tracks:', error);
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

    startTransition(() => {
      setTotalFilteredCount(filtered.length);
      setDisplayedTracks(filtered);
      setQueue(filtered);
    });

    // Update queue index based on the currently selected track without re-creating applyFilters
    setSelectedTrack(currentTrack => {
      if (currentTrack) {
        setQueueIndex(filtered.findIndex(t => t.id === currentTrack.id));
      } else {
        setQueueIndex(-1);
      }
      return currentTrack;
    });
  }, [selectedGenre, debouncedSearchQuery, sortBy]);

  useEffect(() => {
    if (!isLoadingAudio && tracksWithCovers.length > 0) {
      applyFilters(tracksWithCovers);
    }
  }, [selectedGenre, debouncedSearchQuery, isLoadingAudio, tracksWithCovers, applyFilters]);

  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
    addToRecentlyPlayed(track);

    const idx = queue.findIndex(t => t.id === track.id);
    if (idx !== -1) {
      setQueueIndex(idx);
    }
  };

  const handlePlayTrack = (track: Track) => {
    setSelectedTrack(track);
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

  const sortOptions = [
    { value: 'rarity', label: 'Rarest First' },
    { value: 'year-desc', label: 'Newest First' },
    { value: 'year-asc', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'artist', label: 'Artist A-Z' },
  ];

  const hasActiveFilters = searchQuery || selectedGenre !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('all');
  };

  const getSectionTitle = () => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (selectedGenre !== 'all') return `${selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} Tracks`;
    return 'Rarest Tracks';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#0a4d7f]/15 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-[#0d6efd]/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="container mx-auto max-w-7xl pointer-events-auto">
          <div className="header-floating glass px-6 py-2">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <div className="flex items-center gap-0 flex-shrink-0 cursor-pointer group">
                <div className="logo-block">
                  <span className="text-2xl font-black italic tracking-tighter">RARE</span>
                </div>
                <div className="bg-foreground text-background px-3 py-1 font-bold text-xs tracking-[0.3em] uppercase">
                  Grooves
                </div>
              </div>

              {/* Search */}
              <div className="flex-1 max-w-2xl mx-4 flex items-center gap-3">
                <div className="relative group flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <TextInput
                    ref={searchInputRef}
                    placeholder="Search tracks... (press /)"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.currentTarget.value)}
                    classNames={{ input: "pl-11 pr-10 py-5 bg-background/50 backdrop-blur-md border-border/50 text-foreground placeholder:text-muted-foreground rounded-full shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-sm" }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right side buttons - Desktop */}
              <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
                {/* Discovery Actions moved closer to other icons */}
                <SurpriseMeButton
                  tracks={tracksWithCovers}
                  onPlayTrack={(track) => {
                    handleTrackSelect(track);
                    addToRecentlyPlayed(track);
                  }}
                  selectedTrack={selectedTrack}
                  iconOnly
                />

                {displayedTracks.length > 0 && (
                  <DiscoveryButton
                    tracks={tracksWithCovers}
                    onDiscover={(discovered) => {
                      setDiscoveredTracks(discovered);
                      setIsDiscoveryOpen(true);
                    }}
                    currentTrack={selectedTrack}
                    iconOnly
                  />
                )}

                <ThemeToggle />
                <ActionIcon
                  variant="subtle"
                  size="xl"
                  onClick={() => setIsFavoritesOpen(true)}
                  className="relative hover:bg-white/5 rounded-full"
                  color="gray"
                >
                  <Heart className="h-5 w-5 text-foreground" />
                </ActionIcon>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for floating header */}
      <div className="h-24" />

      {/* Main Content */}
      <ErrorBoundary>
        <main className="container mx-auto px-4 pb-40 pt-8">
          {!searchQuery && selectedGenre === 'all' && (
            <div className="mb-10 md:mb-20 border-l-8 border-primary pl-8">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-4 tracking-tighter leading-[0.85] uppercase">
                Discover
                <br />
                <span className="text-primary italic">Rare</span>
                <br />
                Musical Gems
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-muted-foreground max-w-2xl uppercase tracking-tighter">
                Explore the deep archives of jazz, funk, and soul.
              </p>
            </div>
          )}

          {/* Filters Row */}
          <div className="mb-2 flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">

            {/* Visual Genre Explorer */}
            <div className="flex-1 min-w-0">
              <GenreExplorer
                selectedGenre={selectedGenre}
                onGenreChange={handleGenreChange}
              />
            </div>

            <div className="flex items-center flex-wrap gap-3">
              {/* Filter row actions removed - moved to header */}
            </div>
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
                <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">{getSectionTitle()}</h3>
                <p className="text-xs font-medium text-muted-foreground">
                  {isLoadingAudio ? (
                    <span className="text-primary">Loading real tracks and album art...</span>
                  ) : (
                    <>
                      {totalFilteredCount} {totalFilteredCount === 1 ? 'track' : 'tracks'}
                      {loadedCount > 0 && ` • ${loadedCount} with real audio`}
                    </>
                  )}
                </p>
              </div>
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    size="xl"
                    className="bg-background border-2 border-primary/20 rounded-none hover:border-primary h-11 w-11 transition-all"
                    color="gray"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown className="bg-background border-2 border-primary/20 rounded-none">
                  <Menu.Label className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Sort By</Menu.Label>
                  {sortOptions.map((option) => (
                    <Menu.Item
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={`text-sm transition-colors ${sortBy === option.value ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-primary/5'}`}
                    >
                      {option.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
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

            {/* Loading State or Track Grid */}
            {isLoadingAudio || isPending ? (
              <div className="space-y-8">
                {isLoadingAudio && (
                  <LoadingProgress
                    total={rareTracks.length}
                    loaded={loadedCount}
                    label="Loading album art & audio..."
                  />
                )}
                <TrackGridSkeleton count={ITEMS_PER_PAGE} />
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <VirtualizedTrackGrid
                  tracks={displayedTracks}
                  selectedTrack={selectedTrack}
                  onPlay={handleTrackSelect}
                  onFavoriteToggle={() => setIsFavoritesOpen(true)}
                  focusedTrackIndex={focusedTrackIndex}
                />
              </div>
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
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-t-2 border-primary/20 p-3 flex justify-center gap-8 sm:gap-12 items-center shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)]">
        <SurpriseMeButton
          tracks={tracksWithCovers}
          onPlayTrack={(track) => {
            handleTrackSelect(track);
            addToRecentlyPlayed(track);
          }}
          selectedTrack={selectedTrack}
          iconOnly
        />

        {displayedTracks.length > 0 && (
          <DiscoveryButton
            tracks={tracksWithCovers}
            onDiscover={(discovered) => {
              setDiscoveredTracks(discovered);
              setIsDiscoveryOpen(true);
            }}
            currentTrack={selectedTrack}
            iconOnly
          />
        )}

        <ThemeToggle />
        <ActionIcon
          variant="subtle"
          size="xl"
          onClick={() => setIsFavoritesOpen(true)}
          className="relative hover:bg-white/5 rounded-full"
          color="gray"
        >
          <Heart className="h-6 w-6 text-foreground" />
        </ActionIcon>
      </div>

    </div>
  );
}
