'use client';

import { Track } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    } catch (err) {
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
      } catch (err) {
        // User cancelled or share failed
        console.log('[v0] Share cancelled or failed', err);
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Track</DialogTitle>
          <DialogDescription>
            Share this rare groove with your friends
          </DialogDescription>
        </DialogHeader>

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
            <Label htmlFor="share-link">Share Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <Label>Share via</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={shareViaEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={shareViaWhatsApp}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full col-span-2 bg-transparent"
                onClick={shareViaTwitter}
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X (Twitter)
              </Button>
              <Button
                variant="outline"
                className="w-full col-span-2 bg-transparent hover:bg-red-500/10 hover:border-red-500/50"
                asChild
              >
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.artist} ${track.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube className="h-4 w-4 mr-2 text-red-500" />
                  <span className="text-red-400">Listen on YouTube</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Native Share (if available) */}
          {typeof navigator.share === 'function' && (
            <Button
              className="w-full"
              onClick={shareViaNative}
            >
              <Share2 className="h-4 w-4 mr-2" />
              More Options
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
