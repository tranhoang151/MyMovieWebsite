'use client';

import { useMovie } from '@/hooks/useMovies';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import VideoPlayer from '@/components/player/VideoPlayer';
import EpisodeNav from '@/components/player/EpisodeNav';
import EpisodeList from '@/components/movie/EpisodeList';
import ServerSelector from '@/components/player/ServerSelector';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { Episode } from '@/types';

export default function WatchPage() {
  const params = useParams();
  const slug = params.slug as string;
  const ep = params.ep as string;
  const { data: movie, isLoading } = useMovie(slug);
  const { isAuthenticated } = useAuthStore();
  const { saveProgress } = useWatchHistory();
  const [currentServer, setCurrentServer] = useState('');

  useEffect(() => {
    if (movie?.episodes) {
      const grouped: { [k: string]: Episode[] } = {};
      movie.episodes.forEach((e) => {
        if (!grouped[e.serverName]) grouped[e.serverName] = [];
        grouped[e.serverName].push(e);
      });
      const servers = Object.values(grouped);
      if (servers.length > 0) {
        setCurrentServer(servers[0][0].serverName);
      }
    }
  }, [movie]);

  const groupEpisodesByServer = (episodes?: Episode[]) => {
    if (!episodes) return [];
    const grouped: { [k: string]: Episode[] } = {};
    episodes.forEach((e) => {
      if (!grouped[e.serverName]) grouped[e.serverName] = [];
      grouped[e.serverName].push(e);
    });
    return Object.entries(grouped).map(([name, eps]) => ({ name, episodes: eps }));
  };

  const servers = movie?.episodes ? groupEpisodesByServer(movie.episodes) : [];
  const currentServerEpisodes = servers.find((s) => s.name === currentServer)?.episodes || [];

  const currentEpData = movie?.episodes?.find((e) => e.slug === ep && e.serverName === currentServer);

  const handleTimeUpdate = (time: number) => {
    if (!isAuthenticated || !movie) return;
    saveProgress({
      movieId: movie.id,
      episodeSlug: ep,
      serverName: currentServer,
      progressSec: Math.floor(time),
    }).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix-red" />
      </div>
    );
  }

  if (!movie || !currentEpData) {
    return (
      <div className="min-h-screen bg-netflix-dark flex flex-col items-center justify-center text-white gap-4">
        <p>Không tìm thấy tập phim.</p>
        <Link href={`/movies/${slug}`} className="text-netflix-red hover:underline">Quay lại trang phim</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-dark text-white">
      <div className="p-4">
        <Link href={`/movies/${slug}`} className="inline-flex items-center text-netflix-text-secondary hover:text-white transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Quay lại
        </Link>
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <VideoPlayer
          m3u8Url={currentEpData.m3u8Url}
          embedUrl={currentEpData.embedUrl}
          onTimeUpdate={handleTimeUpdate}
        />
        <div className="mt-4">
          <h1 className="text-xl font-bold">{movie.name}</h1>
          <p className="text-netflix-text-secondary text-sm mt-1">{currentEpData.name} — {currentServer}</p>
        </div>
        <ServerSelector
          servers={servers}
          currentServer={currentServer}
          onServerChange={setCurrentServer}
        />
        <EpisodeNav slug={slug} currentEp={ep} episodes={currentServerEpisodes.map(e => ({ name: e.name, slug: e.slug }))} />
        <div className="mt-8 pb-12">
          <h2 className="text-lg font-bold mb-4">Danh sách tập</h2>
          <EpisodeList episodes={movie.episodes || []} movieSlug={slug} currentEp={ep} currentServer={currentServer} />
        </div>
      </div>
    </div>
  );
}
