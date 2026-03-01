'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Music2, Mic2, Disc2, Radio, Headphones, Globe } from 'lucide-react';

export type Genre = {
    value: string;
    label: string;
    icon?: any;
    gradient: string;
};

const GENRES: Genre[] = [
    { value: 'all', label: 'All', icon: Sparkles, gradient: 'var(--primary)' },
    { value: 'jazz', label: 'Jazz', icon: Music2, gradient: 'var(--primary)' },
    { value: 'funk', label: 'Funk', icon: Disc2, gradient: '#FF5F00' },
    { value: 'soul', label: 'Soul', icon: Mic2, gradient: '#7e22ce' },
    { value: 'r&b', label: 'R&B', icon: Headphones, gradient: '#111827' },
    { value: 'reggae', label: 'Reggae', icon: Radio, gradient: '#15803d' },
    { value: 'afrobeat', label: 'Afrobeat', icon: Globe, gradient: '#b91c1c' },
];

interface GenreExplorerProps {
    selectedGenre: string;
    onGenreChange: (genre: string) => void;
    isCompact?: boolean;
}

export function GenreExplorer({ selectedGenre, onGenreChange, isCompact = false }: GenreExplorerProps) {
    return (
        <div className="w-full">
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <AnimatePresence mode="popLayout">
                    {GENRES.map((genre) => {
                        const isSelected = selectedGenre === genre.value;
                        const Icon = genre.icon || Music2;

                        return (
                            <motion.button
                                key={genre.value}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ y: -2, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onGenreChange(genre.value)}
                                className={`relative flex-shrink-0 group overflow-hidden transition-all duration-300 ${isCompact ? 'px-3 h-11' : 'px-3 h-11 sm:px-4 sm:h-11'
                                    } rounded-none flex items-center gap-2 text-left border-2 ${isSelected ? 'border-primary' : 'border-primary/20 hover:border-primary/40'} shadow-[4px_4px_0px_rgba(0,0,0,0.1)]`}
                                style={{
                                    background: isSelected ? genre.gradient : 'transparent',
                                }}
                            >
                                {/* Background Pattern/Glow */}
                                <div
                                    className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}
                                    style={{ background: genre.gradient }}
                                />

                                <div className={`flex-shrink-0 transition-colors`}>
                                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                                </div>

                                <span className={`text-xs sm:text-sm font-black uppercase tracking-tighter whitespace-nowrap ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`}>
                                    {genre.label}
                                </span>

                                {/* Active Indicator */}
                                {isSelected && (
                                    <motion.div
                                        layoutId="active-genre-indicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/60"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
