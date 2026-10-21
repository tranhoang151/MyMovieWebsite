'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Episode } from '@/types';

interface EpisodeListProps {
  episodes: Episode[];
  movieSlug: string;
  currentEp?: string;
  currentServer?: string;
}

interface ServerGroup {
  name: string;
  episodes: Episode[];
}

export default function EpisodeList({ episodes, movieSlug, currentEp, currentServer }: EpisodeListProps) {
  const [activeServer, setActiveServer] = useState<string>('');

  const servers = useMemo<ServerGroup[]>(() => {
    const grouped: Record<string, Episode[]> = {};
    episodes.forEach((ep) => {
      if (!grouped[ep.serverName]) grouped[ep.serverName] = [];
      grouped[ep.serverName].push(ep);
    });
    return Object.entries(grouped).map(([name, eps]) => ({ name, episodes: eps }));
  }, [episodes]);

  const current = currentServer && servers.find((s) => s.name === currentServer)
    ? currentServer
    : (activeServer || servers[0]?.name || '');

  const currentEpisodes = servers.find((s) => s.name === current)?.episodes || [];

  if (!episodes || episodes.length === 0) return null;

  return (
    <div>
      {servers.length > 0 && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {servers.map((server) => (
              <Button
                key={server.name}
                variant={server.name === current ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveServer(server.name)}
                className={
                  server.name === current
                    ? 'bg-netflix-red hover:bg-netflix-red-hover text-white'
                    : 'border-netflix-hover text-netflix-text-secondary hover:text-white'
                }
              >
                {server.name}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {currentEpisodes.map((ep) => (
              <Link
                key={ep.slug}
                href={`/watch/${movieSlug}/${ep.slug}`}
                title={ep.name}
                className={`text-center py-2 px-1 rounded text-xs sm:text-sm font-medium transition-colors truncate block ${
                  ep.slug === currentEp
                    ? 'bg-netflix-red text-white shadow-md'
                    : 'bg-netflix-card text-netflix-text-secondary hover:bg-netflix-hover hover:text-white'
                }`}
              >
                {ep.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
