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
                    ? 'bg-netflix-red hover:bg-netflix-red-hover'
                    : 'border-netflix-hover text-white'
                }
              >
                {server.name}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {currentEpisodes.map((ep) => (
              <Link
                key={ep.slug}
                href={`/watch/${movieSlug}/${ep.slug}`}
                className={`text-center py-2 rounded text-sm transition-colors ${
                  ep.slug === currentEp
                    ? 'bg-netflix-red text-white'
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
