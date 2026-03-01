// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import { memo, type ReactElement } from 'react';
import { Grid } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { Track } from '@/lib/types';
import { TrackCard } from './track-card';
import { TrackCardErrorBoundary } from './track-card-error-boundary';

interface VirtualizedTrackGridProps {
  tracks: Track[];
  onPlay: (track: Track) => void;
  selectedTrack: Track | null;
  onFavoriteToggle?: () => void;
  focusedTrackIndex?: number;
}

interface CellData {
  tracks: Track[];
  columnCount: number;
  onPlay: (track: Track) => void;
  selectedTrack: Track | null;
  onFavoriteToggle?: () => void;
  focusedTrackIndex?: number;
}

const GAP = 12; // gap-3 = 12px

const Cell = (props: {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  ariaAttributes: any;
} & CellData): ReactElement | null => {
  const { tracks, columnCount, onPlay, selectedTrack, onFavoriteToggle, focusedTrackIndex, columnIndex, rowIndex, style } = props;
  const index = rowIndex * columnCount + columnIndex;
  const track = tracks[index];

  if (!track) return null;

  return (
    <div
      style={{
        ...style,
        left: (Number(style.left) || 0) + GAP / 2,
        top: (Number(style.top) || 0) + GAP / 2,
        width: (Number(style.width) || 0) - GAP,
        height: (Number(style.height) || 0) - GAP,
      }}
    >
      <TrackCardErrorBoundary trackId={track.id}>
        <TrackCard
          track={track}
          onPlay={onPlay}
          isPlaying={selectedTrack?.id === track.id}
          onFavoriteToggle={onFavoriteToggle}
          index={index}
          isFocused={focusedTrackIndex === index}
        />
      </TrackCardErrorBoundary>
    </div>
  );
};

// Calculate columns based on window width
function getColumnCount(width: number): number {
  if (width >= 1200) return 5; // Desktop Large
  if (width >= 900) return 4;  // Desktop Small / Laptop
  if (width >= 700) return 3;  // Tablet
  if (width >= 400) return 2;  // Phablet
  return 1;                    // Mobile
}

export const VirtualizedTrackGrid = memo(function VirtualizedTrackGrid({
  tracks,
  onPlay,
  selectedTrack,
  onFavoriteToggle,
  focusedTrackIndex = -1,
}: VirtualizedTrackGridProps) {
  if (!tracks || tracks.length === 0) {
    return <div className="text-white/60 text-center py-20">No tracks available</div>;
  }

  return (
    <div className="w-full relative" style={{ height: '70vh', minHeight: '640px' }}>
      <AutoSizer
        renderProp={({ height, width }: any) => {
          if (!height || !width) {
            return <div className="h-full w-full bg-black/10 animate-pulse rounded-[10px]" />;
          }

          const cols = getColumnCount(width);
          const columnWidth = width / cols;
          // Card height adjustment: aspect ratio + some padding for info
          const rowHeight = columnWidth * 1.35;

          const cellData: CellData = {
            tracks,
            columnCount: cols,
            onPlay,
            selectedTrack,
            onFavoriteToggle,
            focusedTrackIndex,
          };

          return (
            <Grid
              columnCount={cols}
              columnWidth={columnWidth}
              height={height}
              rowCount={Math.ceil(tracks.length / cols)}
              rowHeight={rowHeight}
              width={width}
              cellComponent={Cell as any}
              cellProps={cellData}
            />
          );
        }}
      />
    </div>
  );
});
