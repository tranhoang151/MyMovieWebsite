'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EpisodeNavProps {
  slug: string;
  currentEp: string;
  episodes: { name: string; slug: string }[];
}

export default function EpisodeNav({ slug, currentEp, episodes }: EpisodeNavProps) {
  const currentIndex = episodes.findIndex(e => e.slug === currentEp);
  const prev = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const next = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  return (
    <div className="flex items-center justify-between mt-4">
      <Link href={prev ? `/watch/${slug}/${prev.slug}` : '#'}>
        <Button variant="outline" size="sm" disabled={!prev} className="border-netflix-hover text-white">
          <ChevronLeft size={16} className="mr-1" /> Tập trước
        </Button>
      </Link>
      <span className="text-netflix-text-secondary text-sm">
        Tập {currentEp} / {episodes.length}
      </span>
      <Link href={next ? `/watch/${slug}/${next.slug}` : '#'}>
        <Button variant="outline" size="sm" disabled={!next} className="border-netflix-hover text-white">
          Tập sau <ChevronRight size={16} className="ml-1" />
        </Button>
      </Link>
    </div>
  );
}