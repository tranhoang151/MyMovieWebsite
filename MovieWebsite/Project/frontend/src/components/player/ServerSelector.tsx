'use client';

import { Episode } from '@/types';
import { Button } from '@/components/ui/button';

interface ServerSelectorProps {
  servers: { name: string; episodes: Episode[] }[];
  currentServer: string;
  onServerChange: (serverName: string) => void;
}

export default function ServerSelector({ servers, currentServer, onServerChange }: ServerSelectorProps) {
  if (!servers || servers.length <= 1) return null;

  return (
    <div className="flex items-center space-x-2 mb-4">
      <span className="text-netflix-text-secondary text-sm">Server:</span>
      {servers.map((server) => (
        <Button
          key={server.name}
          variant={server.name === currentServer ? 'default' : 'outline'}
          size="sm"
          onClick={() => onServerChange(server.name)}
          className={
            server.name === currentServer
              ? 'bg-netflix-red hover:bg-netflix-red-hover'
              : 'border-netflix-hover text-netflix-text-secondary hover:text-white'
          }
        >
          {server.name}
        </Button>
      ))}
    </div>
  );
}