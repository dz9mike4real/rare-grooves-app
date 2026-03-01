'use client';

import { Track } from '@/lib/types';
import { Modal, Button, TextInput, Text, ActionIcon } from '@mantine/core';
import { Copy, Check, Mail, MessageCircle, Share2, Youtube } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  track: Track;
  onClose: () => void;
}

export function ShareDialog({ track, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Create shareable link (in production, this would be a real URL)
  const shareUrl = `https://raregrooves.app/track/${track.id}`;
  const shareText = `Check out "${track.title}" by ${track.artist} on Rare Grooves!`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied',
        description: 'Share link has been copied to clipboard.',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Rare Groove: ${track.title}`);
    const body = encodeURIComponent(
      `${shareText}\n\nArtist: ${track.artist}\nAlbum: ${track.album}\nGenre: ${track.genre}\nYear: ${track.year}\n\n${shareUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${track.title} - ${track.artist}`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
        console.log('[v0] Share cancelled or failed');
      }
    } else {
      toast({
        title: 'Share not supported',
        description: 'Web Share API is not supported in your browser.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Modal opened={true} onClose={onClose} title="Share Track" centered>
      <Text size="sm" c="dimmed" mb="md">
        Share this rare groove with your friends
      </Text>

      <div className="space-y-6 py-4">
        {/* Track Info */}
        <div className="space-y-1">
          <p className="font-semibold text-sm text-balance">{track.title}</p>
          <p className="text-sm text-muted-foreground">{track.artist}</p>
          <p className="text-xs text-muted-foreground">
            {track.album} • {track.year}
          </p>
        </div>

        {/* Share Link */}
        <div className="space-y-2">
          <Text size="sm" fw={500}>Share Link</Text>
          <div className="flex gap-2">
            <TextInput
              id="share-link"
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <ActionIcon
              variant="default"
              size="lg"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </ActionIcon>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <Text size="sm" fw={500}>Share via</Text>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="default"
              className="w-full bg-transparent"
              onClick={shareViaEmail}
              leftSection={<Mail className="h-4 w-4" />}
            >
              Email
            </Button>
            <Button
              variant="default"
              className="w-full bg-transparent"
              onClick={shareViaWhatsApp}
              leftSection={<MessageCircle className="h-4 w-4" />}
            >
              WhatsApp
            </Button>
            <Button
              variant="default"
              className="w-full col-span-2 bg-transparent"
              onClick={shareViaTwitter}
              leftSection={
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              }
            >
              X (Twitter)
            </Button>
            <Button
              variant="default"
              className="w-full col-span-2 bg-transparent hover:bg-red-500/10 hover:border-red-500/50"
              component="a"
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.artist} ${track.title}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              leftSection={<Youtube className="h-4 w-4 text-red-500" />}
            >
              <span className="text-red-400">Listen on YouTube</span>
            </Button>
          </div>
        </div>

        {/* Native Share (if available) */}
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <Button
            className="w-full"
            onClick={shareViaNative}
            leftSection={<Share2 className="h-4 w-4" />}
          >
            More Options
          </Button>
        )}
      </div>
    </Modal>
  );
}
