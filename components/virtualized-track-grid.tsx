'use client';

import { memo, useEffect, useState, CSSProperties } from 'react';
import { Grid, CellComponentProps } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { Track } from '@/lib/types';
import { TrackCard } from './track-card';
import { TrackCardErrorBoundary } from './track-card-error-boundary';

interface VirtualizedTrackGridProps {
  tracks: Track[];
  onPlay: (track: Track) => void;
  selectedTrack: Track | null;
  onFavoriteToggle?: () => void;
}

interface CellData {
  tracks: Track[];
  columnCount: number;
  onPlay: (track: Track) => void;
  selectedTrack: Track | null;
  onFavoriteToggle?: () => void;
}

// Calculate columns based on window width
function getColumnCount(width: number): number {
  if (width >= 1536) return 5; // 2xl:grid-cols-5
  if (width >= 1280) return 4; // xl:grid-cols-4
  if (width >= 1024) return 3; // lg:grid-cols-3
  if (width >= 640) return 2;  // sm:grid-cols-2
  return 1;
}

const GAP = 12; // gap-3 = 12px

const Cell = ({
  columnIndex,
  rowIndex,
  style,
  data,
}: CellComponentProps<CellData>) => {
  const { tracks, columnCount, onPlay, selectedTrack, onFavoriteToggle } = data;
  const index = rowIndex * columnCount + columnIndex;
  const track = tracks[index];

  if (!track) return null;

  return (
    <div
      style={{
        ...style,
        left: `${parseFloat(style.left as string) + GAP / 2}px`,
        top: `${parseFloat(style.top as string) + GAP / 2}px`,
        width: `${parseFloat(style.width as string) - GAP}px`,
        height: `${parseFloat(style.height as string) - GAP}px`,
      }}
    >
      <TrackCardErrorBoundary trackId={track.id}>
        <TrackCard
          track={track}
          onPlay={onPlay}
          isPlaying={selectedTrack?.id === track.id}
          onFavoriteToggle={onFavoriteToggle}
        />
      </TrackCardErrorBoundary>
    </div>
  );
};

export const VirtualizedTrackGrid = memo(function VirtualizedTrackGrid({
  tracks,
  onPlay,
  selectedTrack,
  onFavoriteToggle,
}: VirtualizedTrackGridProps) {
  const [columnCount, setColumnCount] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount(window.innerWidth));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cellData: CellData = {
    tracks,
    columnCount,
    onPlay,
    selectedTrack,
    onFavoriteToggle,
  };

  return (
    <div className="w-full" style={{ height: 'calc(100vh - 300px)' }}>
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => {
          const cols = getColumnCount(width);
          const itemWidth = (width - (cols - 1) * GAP) / cols;
          const itemHeight = itemWidth * 1.35; // Aspect ratio for cards

          return (
            <Grid
              columnCount={cols}
              columnWidth={itemWidth + GAP}
              height={height}
              rowCount={Math.ceil(tracks.length / cols)}
              rowHeight={itemHeight + GAP}
              width={width}
              cellComponent={Cell}
              cellProps={cellData}
            />
          );
        }}
      </AutoSizer>
    </div>
  );
});
